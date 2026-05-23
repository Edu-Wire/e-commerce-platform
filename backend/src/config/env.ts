import dotenv from 'dotenv';
import path from 'path';
// Load .env relative to this file — works regardless of working directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const env = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: (process.env.NODE_ENV || 'development').trim(),
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtAdminSecret: process.env.JWT_ADMIN_SECRET || 'dev-admin-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtAdminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10'),
  frontendCustomerUrl: process.env.FRONTEND_CUSTOMER_URL || 'http://localhost:5173',
  frontendAdminUrl: process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174',
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    bucketName: process.env.AWS_BUCKET_NAME || '',
  },
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.MAIL_USER || process.env.SMTP_USER || '',
  smtpPass: process.env.MAIL_PASS || process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@shopnow.local',
};
