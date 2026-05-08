import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import { uploadCSV, uploadImages } from '../../middleware/upload';
import { uploadLimiter } from '../../middleware/rateLimiter';
import * as ctrl from '../../controllers/admin/productAdminController';
import * as bulkCtrl from '../../controllers/admin/bulkUploadController';

const router = Router();

// Bulk upload routes
router.get('/bulk-upload/template', bulkCtrl.downloadTemplate);
router.post(
  '/bulk-upload',
  requireMinRole('manager'),
  uploadLimiter,
  uploadCSV.single('file'),
  bulkCtrl.uploadFile
);
router.get('/bulk-upload/history', requireMinRole('inventory_staff'), bulkCtrl.getUploadHistory);

// Product CRUD
router.get('/', requireMinRole('inventory_staff'), ctrl.getAll);
router.get('/:id', requireMinRole('inventory_staff'), ctrl.getById);
router.post('/', requireMinRole('manager'), ctrl.create);
router.put('/:id', requireMinRole('manager'), ctrl.update);
router.delete('/:id', requireMinRole('manager'), ctrl.deleteProduct);
router.post(
  '/:id/images',
  requireMinRole('manager'),
  uploadImages.array('images', 10),
  ctrl.uploadImages
);

export default router;
