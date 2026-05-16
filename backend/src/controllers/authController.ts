import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database';
import { env } from '../config/env';
import { success, error } from '../utils/helpers';
import { Customer, AdminUser } from '../types';
import https from 'https';

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
      'SELECT * FROM customers WHERE (email = $1 OR phone = $1) AND is_active = true',
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

export async function checkUser(req: Request, res: Response): Promise<void> {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      res.status(400).json(error('identifier is required'));
      return;
    }

    const customer = await queryOne<Customer>(
      'SELECT id FROM customers WHERE (email = $1 OR phone = $1) AND is_active = true',
      [identifier]
    );

    res.json(success({ exists: !!customer }));
  } catch (err) {
    console.error('checkUser error:', err);
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
      'SELECT id, name, email, phone, dob, customer_type, company_name, gst_number, address, settings, is_active, created_at FROM customers WHERE id = $1',
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

function lookupPincode(pincode: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    https.get(`https://api.postalpincode.in/pincode/${pincode}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
            const city = json[0].PostOffice[0].District || json[0].PostOffice[0].Taluk;
            resolve(city);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => { reject(err); });
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.customer!.id;
    const { name, phone, dob, address, settings } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (dob !== undefined) {
      updates.push(`dob = $${paramIndex++}`);
      values.push(dob);
    }
    if (settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(settings));
    }
    if (address !== undefined) {
      console.log('Address received:', address);
      let finalAddress = { ...address };
      
      const cityStr = String(finalAddress.city || '').trim();
      if (/^\d{6}$/.test(cityStr)) {
        const pincode = cityStr;
        try {
          const city = await lookupPincode(pincode);
          console.log('Lookup result for', pincode, ':', city);
          if (city) {
            finalAddress.city = city;
            finalAddress.pincode = pincode;
          } else {
            res.status(400).json(error('Invalid pincode or city not found'));
            return;
          }
        } catch (err) {
          console.error('Pincode lookup failed:', err);
          res.status(400).json(error('Failed to validate pincode. Please try again.'));
          return;
        }
      }

      updates.push(`address = $${paramIndex++}`);
      values.push(JSON.stringify(finalAddress));
    }

    if (updates.length === 0) {
      res.status(400).json(error('No fields to update'));
      return;
    }

    values.push(customerId);
    const queryText = `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, phone, dob, customer_type, company_name, gst_number, address, settings, created_at`;

    const rows = await query<Customer>(queryText, values);
    const customer = rows[0];

    if (!customer) {
      res.status(404).json(error('Customer not found'));
      return;
    }

    res.json(success(customer));
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

