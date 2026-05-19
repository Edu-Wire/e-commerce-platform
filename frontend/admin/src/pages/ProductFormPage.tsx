
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
    <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden mb-6">
      <div className="bg-[#f0f2f2] px-5 py-3 border-b border-gray-300">
        <h3 className="text-base font-bold text-[#0f1111]">{title}</h3>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  const gridClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${gridClass} gap-6`}>{children}</div>;
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#0f1111] mb-1.5">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-red-600 text-sm font-bold">!</span>
          <p className="text-red-600 text-xs font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-400 rounded-sm text-sm focus:outline-none focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange transition-colors shadow-sm';
const INPUT_ERR_CLS = 'w-full px-3 py-2 border border-red-600 bg-red-50 rounded-sm text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 shadow-sm';

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

      // Safety check for specs array
      if (existingProduct.specs && Array.isArray(existingProduct.specs)) {
        existingProduct.specs.forEach((s) => {
          specMap[s.spec_key] = s.spec_value;
        });
      }

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
        tags: Array.isArray(existingProduct.tags) ? existingProduct.tags.join(', ') : '',
        is_featured: existingProduct.is_featured,
        is_active: existingProduct.is_active,
        specs: specMap,
      });
      setImages(existingProduct.images || []);
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

      // Robust check for the data format
      const newImages = res.data.data;
      if (newImages && Array.isArray(newImages)) {
        setImages((prev) => [...prev, ...newImages]);
        toast.success('Images uploaded');
      } else {
        console.error('Unexpected response format:', res.data);
        toast.error('Invalid response format from server');
      }
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
    <div className="w-full pb-12 px-2 sm:px-0">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-300 p-4 rounded shadow-sm mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0f1111]">
              {isEdit ? 'Edit Product Details' : 'Add a Product'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Provide vital info, offers, and images to list your item.</p>
          </div>
        </div>

        <div className="w-full space-y-6">
          {/* Vital Info */}
          <FormSection title="Vital Info">
            <FieldRow>
              <Field label="Item Name (Title)" error={errors.name?.message} required>
                <input {...register('name')} className={errors.name ? INPUT_ERR_CLS : INPUT_CLS} placeholder="e.g. Dell Laptop XPS 15" />
                {watchedName && (
                  <p className="text-xs text-gray-500 mt-1">Slug: <span className="font-mono">{slugify(watchedName)}</span></p>
                )}
              </Field>
              <Field label="Seller SKU" error={errors.sku?.message} required>
                <input {...register('sku')} className={errors.sku ? INPUT_ERR_CLS : INPUT_CLS} placeholder="e.g. DELL-XPS15-001" />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Brand Name" error={errors.brand?.message}>
                <input {...register('brand')} className={INPUT_CLS} placeholder="e.g. Dell" />
              </Field>
              <Field label="Product Category" error={errors.category_id?.message} required>
                <select {...register('category_id')} className={errors.category_id ? INPUT_ERR_CLS : INPUT_CLS}>
                  <option value="">Select category...</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </FieldRow>
            <Field label="Product Description" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={4}
                className={INPUT_CLS}
                placeholder="Detailed product description..."
              />
            </Field>
          </FormSection>

          {/* Images */}
          <FormSection title="Images">
            <div className="mb-4">
              <p className="text-sm text-[#0f1111] font-medium">To ensure high-quality listings, images must meet Amazon-style standards. Pure white backgrounds are recommended.</p>
            </div>
            <div
              className={`border-2 border-dashed rounded-md p-10 text-center transition-colors cursor-pointer ${isDragging ? 'border-amazon-orange bg-orange-50' : 'border-gray-300 hover:border-amazon-orange hover:bg-gray-50'
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
                <div className="flex flex-col items-center gap-3">
                  <LoadingSpinner />
                  <p className="text-sm font-bold text-gray-600">Uploading Images...</p>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-3">📸</div>
                  <p className="text-sm font-bold text-amazon-blue">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG, WEBP (Max 5MB each)</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group border border-gray-200 rounded-sm p-1 bg-white hover:border-amazon-orange transition-colors">
                    <img
                      src={img.url}
                      alt={`Product image ${idx + 1}`}
                      className="w-full aspect-square object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-300 text-red-600 rounded-full shadow-md text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 flex items-center justify-center"
                    >
                      ×
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-amazon-orange text-white text-[10px] font-bold text-center py-0.5">
                        MAIN IMAGE
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* Condition */}
          <FormSection title="Condition & Grading">
            <div>
              <label className="block text-sm font-bold text-[#0f1111] mb-2">Item Condition <span className="text-red-600">*</span></label>
              <div className="flex flex-col gap-2">
                {(['new', 'new_with_minor_damage', 'new_with_defect'] as const).map((c) => {
                  const labels: Record<string, string> = {
                    new: 'New - Item is brand new, unused, unopened',
                    new_with_minor_damage: 'New with Minor Damage - Box opened or minor cosmetic damage',
                    new_with_defect: 'New with Defect - Item is new but has functional/manufacturing defect',
                  };
                  return (
                    <label key={c} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        value={c}
                        {...register('condition')}
                        className="mt-0.5 accent-amazon-orange w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#0f1111] group-hover:text-amazon-orange transition-colors">{labels[c]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {watchedCondition !== 'new' && (
              <Field label="Condition Note (Damage Description)" error={errors.damage_description?.message}>
                <textarea {...register('damage_description')} rows={2} className={INPUT_CLS} placeholder="Please describe the damage in detail for buyers..." />
              </Field>
            )}
            {watchedCondition === 'new_with_defect' && (
              <Field label="Defect Note" error={errors.defect_description?.message}>
                <textarea {...register('defect_description')} rows={2} className={INPUT_CLS} placeholder="Please describe the defect in detail..." />
              </Field>
            )}
          </FormSection>

          {/* Offer & Pricing */}
          <FormSection title="Offer & Pricing">
            <FieldRow cols={3}>
              <Field label="Maximum Retail Price (₹)" error={errors.mrp?.message} required>
                <input
                  type="number"
                  step="0.01"
                  {...register('mrp')}
                  className={errors.mrp ? INPUT_ERR_CLS : INPUT_CLS}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Your Buying Price (₹)" error={errors.buying_price?.message} required>
                <input
                  type="number"
                  step="0.01"
                  {...register('buying_price')}
                  className={errors.buying_price ? INPUT_ERR_CLS : INPUT_CLS}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Your Selling Price (₹)" error={errors.selling_price?.message} required>
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
            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100 mt-4">
              <div className={`flex items-center gap-2 text-sm font-bold ${discountPercent > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                <span>Calculated Discount:</span>
                <span>{discountPercent.toFixed(0)}% OFF</span>
              </div>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className={`flex items-center gap-2 text-sm font-bold ${profitPerUnit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                <span>Estimated Margin per unit:</span>
                <span>₹{profitPerUnit.toFixed(2)}</span>
              </div>
            </div>
          </FormSection>

          {/* Inventory Setup */}
          <FormSection title="Inventory Setup">
            <FieldRow>
              <Field label="Quantity" error={errors.stock_quantity?.message} required>
                <input type="number" {...register('stock_quantity')} className={errors.stock_quantity ? INPUT_ERR_CLS : INPUT_CLS} />
              </Field>
              <Field label="Minimum Stock Alert" error={errors.minimum_stock_alert?.message}>
                <input type="number" {...register('minimum_stock_alert')} className={INPUT_CLS} />
              </Field>
            </FieldRow>
          </FormSection>

          {/* B2B & Audience */}
          <FormSection title="B2B & Audience">
            <div className="flex flex-col sm:flex-row gap-8 mb-4">
              <Controller
                name="is_b2c_available"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-amazon-orange rounded-sm border-gray-400"
                    />
                    <span className="text-sm font-bold text-[#0f1111] group-hover:text-amazon-orange">Available for Retail (B2C)</span>
                  </label>
                )}
              />
              <Controller
                name="is_b2b_available"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-amazon-orange rounded-sm border-gray-400"
                    />
                    <span className="text-sm font-bold text-[#0f1111] group-hover:text-amazon-orange">Available for Business (B2B)</span>
                  </label>
                )}
              />
            </div>

            {watchedB2b && (
              <div className="p-4 bg-[#f7fafa] border border-gray-200 rounded-sm mt-4">
                <h4 className="text-sm font-bold text-[#0f1111] mb-4">Business Pricing Rules</h4>
                <FieldRow>
                  <Field label="Business Price (₹)" error={errors.b2b_price?.message}>
                    <input type="number" step="0.01" {...register('b2b_price')} className={INPUT_CLS} placeholder="0.00" />
                  </Field>
                  <Field label="Minimum Quantity for B2B" error={errors.b2b_min_quantity?.message}>
                    <input type="number" {...register('b2b_min_quantity')} className={INPUT_CLS} placeholder="e.g. 10" />
                  </Field>
                </FieldRow>
              </div>
            )}
          </FormSection>

          {/* Dynamic Specifications */}
          {specTemplates && specTemplates.length > 0 && (
            <FormSection title="More Details (Specifications)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          {/* Shipping & Dimensions */}
          <FormSection title="Shipping & Dimensions">
            <FieldRow>
              <Field label="Item Weight (grams)">
                <input type="number" {...register('weight_grams')} className={INPUT_CLS} placeholder="500" />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="L (cm)">
                  <input type="number" step="0.1" {...register('length_cm')} className={INPUT_CLS} placeholder="30" />
                </Field>
                <Field label="W (cm)">
                  <input type="number" step="0.1" {...register('width_cm')} className={INPUT_CLS} placeholder="20" />
                </Field>
                <Field label="H (cm)">
                  <input type="number" step="0.1" {...register('height_cm')} className={INPUT_CLS} placeholder="10" />
                </Field>
              </div>
            </FieldRow>
          </FormSection>

          {/* Discovery */}
          <FormSection title="Discovery">
            <Field label="Search Terms (Tags)" error={errors.tags?.message}>
              <textarea
                rows={3}
                {...register('tags')}
                className={INPUT_CLS}
                placeholder="Comma-separated keywords..."
                onChange={(e) => setValue('tags', e.target.value)}
              />
            </Field>

            <div className="mt-6 space-y-3 pt-4 border-t border-gray-100">
              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-amazon-orange rounded-sm border-gray-400"
                    />
                    <span className="text-sm font-bold text-[#0f1111] group-hover:text-amazon-orange">Feature Product</span>
                  </label>
                )}
              />
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 accent-amazon-orange rounded-sm border-gray-400"
                    />
                    <span className="text-sm font-bold text-[#0f1111] group-hover:text-amazon-orange">Active Listing</span>
                  </label>
                )}
              />
            </div>
          </FormSection>
        </div>

        {/* Bottom Submit Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 bg-white border border-gray-300 rounded shadow-sm mt-6">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="flex-1 sm:flex-none px-4 py-1.5 text-sm font-bold text-[#0f1111] bg-white border border-[#d5d9d9] rounded-md hover:bg-[#f7fafa] shadow-sm transition-colors text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-1.5 text-sm font-bold text-[#0f1111] bg-[#F3A847] hover:bg-[#e39a37] border border-[#a88734] rounded-md disabled:opacity-60 shadow-sm transition-colors"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isEdit ? 'Save and finish' : 'Save and finish'}
          </button>
        </div>
      </form>
    </div>
  );
}
