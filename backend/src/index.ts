import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { env } from './config/env';
import { pool } from './config/database';
import routes from './routes/index';
import walletRoutes from './routes/wallet';
import { checkAndRotateAuctions } from './utils/auctionManager';
import { updateAuctionStatus } from './controllers/admin/inventoryController';
import { authenticateAdmin, authenticateCustomer } from './middleware/auth';
import { requireMinRole } from './middleware/rbac';
import { getMyBids, getWinningDashboard, getWonAuctions, getQueuedAuctions } from './controllers/auctionController';

const app = express(); // trigger tsx reload - support ticket and activity logs removed from reports module
 
// Security & utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
const allowedOrigins = env.nodeEnv === 'development'
  ? true
  : [
      env.frontendCustomerUrl,
      env.frontendAdminUrl,
      // EC2 direct IP access
      'http://43.204.158.70',
      'http://43.204.158.70:3001',
      // Production domains
      'http://shopnow.digi-wire.com',
      'https://shopnow.digi-wire.com',
      'http://admin.shopnow.digi-wire.com',
      'https://admin.shopnow.digi-wire.com',
    ].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Swagger documentation
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Retail Platform API',
      version: '1.0.0',
      description: 'Complete backend API for a production ecommerce retail platform',
    },
    servers: [
      { url: `http://localhost:${env.port}`, description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.nodeEnv });
});

// Direct route to avoid 404 issues with nested routers
app.patch('/api/admin/inventory/auction/:id', authenticateAdmin, requireMinRole('manager'), updateAuctionStatus);

// Wallet (mounted here so routes are always registered after hot-reload)
app.use('/api/wallet', walletRoutes);

// Auction routes that must not be captured by /api/auctions/:id
app.get('/api/auctions/my-bids', authenticateCustomer, getMyBids);
app.get('/api/auctions/winning', authenticateCustomer, getWinningDashboard);
app.get('/api/auctions/won', authenticateCustomer, getWonAuctions);
app.get('/api/auctions/queued', getQueuedAuctions);

// Mount all API routes
app.use('/', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error', stack: err.stack });
});

// Start server
async function bootstrap() {
  try {
    // Test DB connection
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();

    // Start Auction Scheduler (Runs every minute)
    checkAndRotateAuctions();
    setInterval(checkAndRotateAuctions, 60 * 1000);
    console.log('Auction scheduler started');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    console.warn('Starting server without confirmed DB connection...');
  }

    const https = require('https');
    const fs = require('fs');
    const keyPath = '/etc/letsencrypt/live/e-commec2.duckdns.org/privkey.pem';
    const certPath = '/etc/letsencrypt/live/e-commec2.duckdns.org/fullchain.pem';

    let server;

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const certOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      server = https.createServer(certOptions, app).listen(env.port, () => {
        console.log(`Server running on https://e-commec2.duckdns.org:${env.port} in ${env.nodeEnv} mode`);
        console.log(`API docs: https://e-commec2.duckdns.org:${env.port}/api/docs`);
        console.log(`Health check: https://e-commec2.duckdns.org:${env.port}/health`);
      });
    } else {
      console.warn('SSL certificates not found. Starting HTTP server instead (Local Dev).');
      server = app.listen(env.port, () => {
        console.log(`Server running on http://localhost:${env.port} in ${env.nodeEnv} mode`);
        console.log(`API docs: http://localhost:${env.port}/api/docs`);
        console.log(`Health check: http://localhost:${env.port}/health`);
      });
    }

    // Attach Socket.io
    const { Server } = require('socket.io');
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket: import('socket.io').Socket) => {
      console.log('a user connected:', socket.id);

      socket.join('live_auctions');

      socket.on('join_live_auctions', () => {
        socket.join('live_auctions');
      });

      socket.on('join_auction', (auction_id: string) => {
        socket.join(`auction:${auction_id}`);
      });

      socket.on('place_bid', async (data: { auction_id: string; bid_amount: string | number; token: string }) => {
        const { auction_id, bid_amount, token } = data;
        const jwt = require('jsonwebtoken');
        const { env } = require('./config/env');
        const { processPlaceBid, BidError } = require('./services/auctionBidService');

        try {
          if (!token) {
            socket.emit('bid_error', { error: 'Unauthorized' });
            return;
          }
          const payload = jwt.verify(token, env.jwtSecret);
          const customer_id = payload.id;

          await processPlaceBid(
            Number(auction_id),
            customer_id,
            Number(bid_amount),
            io
          );

          socket.emit('bid_success', { message: 'Bid placed successfully' });
        } catch (err) {
          if (err instanceof BidError || (err as { name?: string })?.name === 'BidError') {
            socket.emit('bid_error', { error: (err as Error).message });
            return;
          }
          console.error('Socket place_bid error:', err);
          socket.emit('bid_error', { error: 'Failed to place bid' });
        }
      });
      
      socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
      });
    });

    app.set('io', io);

    process.on('SIGINT', () => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
}

bootstrap();

export default app;
