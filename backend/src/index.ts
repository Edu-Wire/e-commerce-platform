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

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors({
  origin: [env.frontendCustomerUrl, env.frontendAdminUrl],
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

// Mount all API routes
app.use('/', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function bootstrap() {
  try {
    // Test DB connection
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (err) {
    console.error('Failed to connect to database:', err);
    console.warn('Starting server without confirmed DB connection...');
  }

    const server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
      console.log(`API docs: http://localhost:${env.port}/api/docs`);
      console.log(`Health check: http://localhost:${env.port}/health`);
    });

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
