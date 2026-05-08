import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../../config/database';
import { success, error } from '../../utils/helpers';
import { AdminUser, AdminRole } from '../../types';

const VALID_ROLES: AdminRole[] = ['owner', 'manager', 'inventory_staff', 'viewer'];

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const users = await query<AdminUser>(
      'SELECT id, name, email, role, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC'
    );
    res.json(success(users));
  } catch (err) {
    console.error('admin getAll users error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json(error('name, email, password, and role are required'));
      return;
    }
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json(error(`role must be one of: ${VALID_ROLES.join(', ')}`));
      return;
    }
    if (password.length < 6) {
      res.status(400).json(error('Password must be at least 6 characters'));
      return;
    }

    const existing = await queryOne('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing) {
      res.status(409).json(error('Email already registered'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rows = await query<AdminUser>(
      `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active, last_login, created_at`,
      [name, email, passwordHash, role]
    );

    res.status(201).json(success(rows[0]));
  } catch (err) {
    console.error('admin create user error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    const existing = await queryOne<AdminUser>('SELECT * FROM admin_users WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Admin user not found'));
      return;
    }

    // Cannot change role of an owner
    if (existing.role === 'owner' && role && role !== 'owner') {
      res.status(403).json(error('Cannot change the role of an owner account'));
      return;
    }

    if (role && !VALID_ROLES.includes(role)) {
      res.status(400).json(error(`role must be one of: ${VALID_ROLES.join(', ')}`));
      return;
    }

    const rows = await query<AdminUser>(
      `UPDATE admin_users SET
         name = $1,
         role = $2,
         is_active = $3
       WHERE id = $4
       RETURNING id, name, email, role, is_active, last_login, created_at`,
      [
        name ?? existing.name,
        role ?? existing.role,
        is_active !== undefined ? is_active : existing.is_active,
        id,
      ]
    );

    res.json(success(rows[0]));
  } catch (err) {
    console.error('admin update user error:', err);
    res.status(500).json(error('Internal server error'));
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      res.status(400).json(error('new_password must be at least 6 characters'));
      return;
    }

    const existing = await queryOne('SELECT id FROM admin_users WHERE id = $1', [id]);
    if (!existing) {
      res.status(404).json(error('Admin user not found'));
      return;
    }

    const passwordHash = await bcrypt.hash(new_password, 12);
    await query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);

    res.json(success({ message: 'Password reset successfully' }));
  } catch (err) {
    console.error('admin resetPassword error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
