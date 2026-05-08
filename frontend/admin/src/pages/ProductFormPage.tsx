import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAdminCategories, useAdminCategorySpecTemplates } from '../hooks/useAdminCategories';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '../hooks/useAdminProducts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../lib/api';
import type { ApiResponse, ProductImage, SpecTemplate } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  brand: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  condition: z.enum(['new', 'new_with_minor_damage', 'new_with_defect']),
  damage_description: z.string().optional(),
  defect_description: z.string().optional(),
  mrp: z.coerce.number().positive('MRP must be > 0'),
  buying_price: z.coerce.number().positive('Buying price must be > 0'),
  selling_price: z.coerce.number().positive('Selling price must be > 0'),
  is_b2c_available: z.boolean(),
  is_b2b_available: z.boolean(),
  b2b_price: z.coerce.number().optional(),
  b2b_min_quantity: z.coerce.number().optional(),
  stock_quantity: z.coerce.number().int().min(0),
  minimum_stock_alert: z.coerce.number().int().min(0),
  weight_grams: z.coerce.number().optional(),
  length_cm: z.coerce.number().optional(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  tags: z.string().optional(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  specs: z.record(z.string()).optional(),
}).refine((d) => d.selling_price <= d.mrp, {
  message: 'Selling price cannot exceed MRP',
  path: ['selling_price'],
});

type FormData = z.infer<typeof schema>;

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  const gridClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${gridClass} gap-4`}>{children}</div>;
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';
const INPUT_ERR_CLS = 'w-full px-3 py-2 border border-red-400 bg-red-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingProduct, isLoading: loadingProduct } = useAdminProduct(id);
  const { data: categories } = useAdminCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      condition: 'new',
      is_b2c_available: true,
      is_b2b_available: false,
      is_featured: false,
      is_active: true,
      stock_quantity: 0,
      minimum_stock_alert: 5,
    },
  });

  // Watch fields for live calculations and conditional rendering
  const watchedName = watch('name');
  const watchedMrp = watch('mrp');
  const watchedBuyingPrice = watch('buying_price');
  const watchedSellingPrice = watch('selling_price');
  const watchedCondition = watch('condition');
  const watchedB2b = watch('is_b2b_available');
  const watchedCategoryId = watch('category_id');

  // Fetch spec templates for selected category
  const { data: specTemplates } = useAdminCategorySpecTemplates(watchedCategoryId ?? null);

  // Derived calculations
  const discountPercent =
    watchedMrp > 0 && watchedSellingPrice > 0
      ? ((watchedMrp - watchedSellingPrice) / watchedMrp) * 100
      : 0;
  const profitPerUnit =
    watchedSellingPrice > 0 && watchedBuyingPrice > 0
      ? watchedSellingPrice - watchedBuyingPrice
      : 0;

  // Populate form when editing
  useEffect(() => {
    if (existingProduct && isEdit) {
      const specMap: Record<string, string> = {};
      existingProduct.specs.forEach((s) => {
        specMap[s.spec_key] = s.spec_value;
      });
      reset({
        name: existingProduct.name,
        sku: existingProduct.sku,
        brand: existingProduct.brand ?? '',
        category_id: existingProduct.category_id,
        description: existingProduct.description ?? '',
        condition: existingProduct.condition,
        damage_description: existingProduct.damage_description ?? '',
        defect_description: existingProduct.defect_description ?? '',
        mrp: existingProduct.mrp,
        buying_price: existingProduct.buying_price,
        selling_price: existingProduct.selling_price,
        is_b2c_available: existingProduct.is_b2c_available,
        is_b2b_available: existingProduct.is_b2b_available,
        b2b_price: existingProduct.b2b_price ?? undefined,
        b2b_min_quantity: existingProduct.b2b_min_quantity ?? undefined,
        stock_quantity: existingProduct.stock_quantity,
        minimum_stock_alert: existingProduct.minimum_stock_alert,
        weight_grams: existingProduct.weight_grams ?? undefined,
        length_cm: existingProduct.length_cm ?? undefined,
        width_cm: existingProduct.width_cm ?? undefined,
        height_cm: existingProduct.height_cm ?? undefined,
        tags: existingProduct.tags.join(', '),
        is_featured: existingProduct.is_featured,
        is_active: existingProduct.is_active,
        specs: specMap,
      });
      setImages(existingProduct.images);
    }
  }, [existingProduct, isEdit, reset]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('images', f));
      const res = await api.post<ApiResponse<ProductImage[]>>('/admin/products/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, ...res.data.data]);
      toast.success('Images uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const specsArray = specTemplates
        ? specTemplates.map((t: SpecTemplate) => ({
            spec_key: t.spec_key,
            spec_label: t.spec_label,
            spec_value: data.specs?.[t.spec_key] ?? '',
          }))
        : [];

      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images: images.map((img, idx) => ({ ...img, sort_order: idx })),
        specs: specsArray,
        damage_description: data.condition !== 'new' ? data.damage_description : undefined,
        defect_description: data.condition === 'new_with_defect' ? data.defect_description : undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
        toast.success('Product updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to create product');
    }
  };

  if (isEdit && loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic Info */}
        <FormSection title="Basic Information">
          <FieldRow>
            <Field label="Product Name" error={errors.name?.message} required>
              <input {...register('name')} className={errors.name ? INPUT_ERR_CLS : INPUT_CLS} placeholder="e.g. Dell Laptop XPS 15" />
              {watchedName && (
                <p className="text-xs text-gray-400 mt-1">Slug: <span className="font-mono">{slugify(watchedName)}</span></p>
              )}
            </Field>
            <Field label="SKU" error={errors.sku?.message} required>
              <input {...register('sku')} className={errors.sku ? INPUT_ERR_CLS : INPUT_CLS} placeholder="e.g. DELL-XPS15-001" />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Brand" error={errors.brand?.message}>
              <input {...register('brand')} className={INPUT_CLS} placeholder="e.g. Dell" />
            </Field>
            <Field label="Category" error={errors.category_id?.message} required>
              <select {...register('category_id')} className={errors.category_id ? INPUT_ERR_CLS : INPUT_CLS}>
                <option value="">Select category...</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </FieldRow>
          <Field label="Description" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={4}
              className={INPUT_CLS}
              placeholder="Detailed product description..."
            />
          </Field>
        </FormSection>

        {/* Condition */}
        <FormSection title="Condition">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-3">
              {(['new', 'new_with_minor_damage', 'new_with_defect'] as const).map((c) => {
                const labels: Record<string, string> = {
                  new: '✅ New',
                  new_with_minor_damage: '⚠️ New with Minor Damage',
                  new_with_defect: '🔶 New with Defect',
                };
                return (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={c}
                      {...register('condition')}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{labels[c]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {watchedCondition !== 'new' && (
            <Field label="Damage Description" error={errors.damage_description?.message}>
              <textarea {...register('damage_description')} rows={2} className={INPUT_CLS} placeholder="Describe the damage..." />
            </Field>
          )}
          {watchedCondition === 'new_with_defect' && (
            <Field label="Defect Description" error={errors.defect_description?.message}>
              <textarea {...register('defect_description')} rows={2} className={INPUT_CLS} placeholder="Describe the defect..." />
            </Field>
          )}
        </FormSection>

        {/* Pricing */}
        <FormSection title="Pricing">
          <FieldRow cols={3}>
            <Field label="MRP (₹)" error={errors.mrp?.message} required>
              <input
                type="number"
                step="0.01"
                {...register('mrp')}
                className={errors.mrp ? INPUT_ERR_CLS : INPUT_CLS}
                placeholder="0.00"
              />
            </Field>
            <Field label="Buying Price (₹)" error={errors.buying_price?.message} required>
              <input
                type="number"
                step="0.01"
                {...register('buying_price')}
                className={errors.buying_price ? INPUT_ERR_CLS : INPUT_CLS}
                placeholder="0.00"
              />
            </Field>
            <Field label="Selling Price (₹)" error={errors.selling_price?.message} required>
              <input
                type="number"
                step="0.01"
                {...register('selling_price')}
                className={errors.selling_price ? INPUT_ERR_CLS : INPUT_CLS}
                placeholder="0.00"
              />
            </Field>
          </FieldRow>

          {/* Live calculations */}
          <div className="flex flex-wrap gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${discountPercent > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              <span>Discount:</span>
              <span className="font-bold">{discountPercent.toFixed(0)}% OFF</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${profitPerUnit >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
              <span>Profit per unit:</span>
              <span className="font-bold">₹{profitPerUnit.toFixed(2)}</span>
            </div>
          </div>
        </FormSection>

        {/* Availability */}
        <FormSection title="Availability">
          <div className="flex flex-wrap gap-6">
            <Controller
              name="is_b2c_available"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">B2C Available</span>
                </label>
              )}
            />
            <Controller
              name="is_b2b_available"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">B2B Available</span>
                </label>
              )}
            />
          </div>

          {watchedB2b && (
            <FieldRow>
              <Field label="B2B Price (₹)" error={errors.b2b_price?.message}>
                <input type="number" step="0.01" {...register('b2b_price')} className={INPUT_CLS} placeholder="0.00" />
              </Field>
              <Field label="B2B Min Quantity" error={errors.b2b_min_quantity?.message}>
                <input type="number" {...register('b2b_min_quantity')} className={INPUT_CLS} placeholder="e.g. 10" />
              </Field>
            </FieldRow>
          )}
        </FormSection>

        {/* Inventory */}
        <FormSection title="Inventory">
          <FieldRow>
            <Field label="Stock Quantity" error={errors.stock_quantity?.message} required>
              <input type="number" {...register('stock_quantity')} className={errors.stock_quantity ? INPUT_ERR_CLS : INPUT_CLS} />
            </Field>
            <Field label="Low Stock Alert (min)" error={errors.minimum_stock_alert?.message}>
              <input type="number" {...register('minimum_stock_alert')} className={INPUT_CLS} />
            </Field>
          </FieldRow>
        </FormSection>

        {/* Dynamic Specifications */}
        {specTemplates && specTemplates.length > 0 && (
          <FormSection title="Specifications">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...specTemplates]
                .sort((a: SpecTemplate, b: SpecTemplate) => a.sort_order - b.sort_order)
                .map((t: SpecTemplate) => (
                  <Field
                    key={t.spec_key}
                    label={t.spec_label}
                    required={t.is_required}
                  >
                    {t.spec_type === 'boolean' ? (
                      <select {...register(`specs.${t.spec_key}`)} className={INPUT_CLS}>
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : t.spec_type === 'select' && t.spec_options ? (
                      <select {...register(`specs.${t.spec_key}`)} className={INPUT_CLS}>
                        <option value="">Select...</option>
                        {t.spec_options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : t.spec_type === 'number' ? (
                      <input type="number" {...register(`specs.${t.spec_key}`)} className={INPUT_CLS} />
                    ) : (
                      <input type="text" {...register(`specs.${t.spec_key}`)} className={INPUT_CLS} />
                    )}
                  </Field>
                ))}
            </div>
          </FormSection>
        )}

        {/* Images */}
        <FormSection title="Images">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void handleImageUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingImages ? (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-sm font-medium text-gray-600">Drag & drop images or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — multiple files supported</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void handleImageUpload(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.url}
                    alt={`Product image ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-xs bg-blue-500 text-white px-1 rounded">Primary</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* Physical / Other */}
        <FormSection title="Physical Details & Other">
          <FieldRow cols={4}>
            <Field label="Weight (g)">
              <input type="number" {...register('weight_grams')} className={INPUT_CLS} placeholder="500" />
            </Field>
            <Field label="Length (cm)">
              <input type="number" step="0.1" {...register('length_cm')} className={INPUT_CLS} placeholder="30" />
            </Field>
            <Field label="Width (cm)">
              <input type="number" step="0.1" {...register('width_cm')} className={INPUT_CLS} placeholder="20" />
            </Field>
            <Field label="Height (cm)">
              <input type="number" step="0.1" {...register('height_cm')} className={INPUT_CLS} placeholder="10" />
            </Field>
          </FieldRow>

          <Field label="Tags (comma-separated)" error={errors.tags?.message}>
            <input
              type="text"
              {...register('tags')}
              className={INPUT_CLS}
              placeholder="e.g. laptop, dell, refurbished"
              onChange={(e) => setValue('tags', e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-6">
            <Controller
              name="is_featured"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-amber-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">⭐ Featured Product</span>
                </label>
              )}
            />
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-700">Active (visible on store)</span>
                </label>
              )}
            />
          </div>
        </FormSection>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
