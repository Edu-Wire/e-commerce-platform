import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database';
import { env } from '../config/env';
import { success, error } from '../utils/helpers';
import { Customer, AdminUser } from '../types';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, customer_type, company_name, gst_number, phone } = req.body;

    if (!name || !email || !password || !customer_type) {
      res.status(400).json(error('name, email, password, and customer_type are required'));
      return;
    }
    if (!['b2c', 'b2b'].includes(customer_type)) {
      res.status(400).json(error('customer_type must be b2c or b2b'));
      return;
    }
    if (customer_type === 'b2b' && !company_name) {
      res.status(400).json(error('company_name is required for B2B customers'));
      return;
    }
    if (password.length < 6) {
      res.status(400).json(error('Password must be at least 6 characters'));
      return;
    }

    const existing = await queryOne<Customer>('SELECT id FROM customers WHERE email = $1', [email]);
    if (existing) {
      res.status(409).json(error('Email already registered'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rows = await query<Customer>(
      `INSERT INTO customers (name, email, password_hash, phone, customer_type, company_name, gst_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, customer_type, company_name, gst_number, created_at`,
      [name, email, passwordHash, phone || null, customer_type, company_name || null, gst_number || null]
    );
    const customer = rows[0];

    const token = jwt.sign(
      { id: customer.id, email: customer.email, customer_type: customer.customer_type },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
    );

    res.status(201).json(success({ customer, token }));
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json(error('email and password are required'));
      return;
    }

    const customer = await queryOne<Customer & { password_hash: string }>(
      'SELECT * FROM customers WHERE email = $1 AND is_active = true',
      [email]
    );
    if (!customer) {
      res.status(401).json(error('Invalid email or password'));
      return;
    }

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      res.status(401).json(error('Invalid email or password'));
      return;
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, customer_type: customer.customer_type },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn } as jwt.SignOptions
    );

    const { password_hash: _ph, ...customerData } = customer;
    res.json(success({ customer: customerData, token }));
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json(error('email and password are required'));
      return;
    }

    const admin = await queryOne<AdminUser & { password_hash: string }>(
      'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
      [email]
    );
    if (!admin) {
      res.status(401).json(error('Invalid email or password'));
      return;
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      res.status(401).json(error('Invalid email or password'));
      return;
    }

    await query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      env.jwtAdminSecret,
      { expiresIn: env.jwtAdminExpiresIn } as jwt.SignOptions
    );

    const { password_hash: _ph, ...adminData } = admin;
    res.json(success({ admin: adminData, token }));
  } catch (err) {
    console.error('adminLogin error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const customer = await queryOne<Customer>(
      'SELECT id, name, email, phone, customer_type, company_name, gst_number, address, is_active, created_at FROM customers WHERE id = $1',
      [customerId]
    );
    if (!customer) {
      res.status(404).json(error('Customer not found'));
      return;
    }
    res.json(success(customer));
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function getAdminProfile(req: Request, res: Response): Promise<void> {
  try {
    const adminId = req.admin!.id;
    const admin = await queryOne<AdminUser>(
      'SELECT id, name, email, role, is_active, last_login, created_at FROM admin_users WHERE id = $1',
      [adminId]
    );
    if (!admin) {
      res.status(404).json(error('Admin not found'));
      return;
    }
    res.json(success(admin));
  } catch (err) {
    console.error('getAdminProfile error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
