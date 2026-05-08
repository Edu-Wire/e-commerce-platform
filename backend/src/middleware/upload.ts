import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/env';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const imageStorage = multer.diskStorage({
  destination(_req: Request, _file: Express.Multer.File, cb) {
    const dir = path.join(env.uploadDir, 'products');
    ensureDir(dir);
    cb(null, dir);
  },
  filename(_req: Request, file: Express.Multer.File, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const randomPart = Math.round(Math.random() * 1e9);
    cb(null, `${timestamp}-${randomPart}${ext}`);
  },
});

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
}

export const uploadImages = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: 10,
  },
});

const csvStorage = multer.diskStorage({
  destination(_req: Request, _file: Express.Multer.File, cb) {
    const dir = path.join(env.uploadDir, 'bulk');
    ensureDir(dir);
    cb(null, dir);
  },
  filename(_req: Request, file: Express.Multer.File, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    cb(null, `bulk-${timestamp}${ext}`);
  },
});

function csvFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const allowed = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (allowed.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'));
  }
}

export const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
});
