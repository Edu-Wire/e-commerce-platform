import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '../types';

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  owner: 4,
  manager: 3,
  inventory_staff: 2,
  viewer: 1,
};

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(admin.role)) {
      res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireMinRole(minRole: AdminRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = req.admin;
    if (!admin) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (ROLE_HIERARCHY[admin.role as AdminRole] < ROLE_HIERARCHY[minRole]) {
      res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
}
