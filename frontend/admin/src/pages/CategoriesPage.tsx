import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  useAdminCategories,
  useAdminCategorySpecTemplates,
  useCreateCategory,
  useUpdateCategory,
  useSaveSpecTemplates,
} from '../hooks/useAdminCategories';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Category, SpecTemplate, SpecType } from '../types';

const catSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parent_id: z.string().optional(),
  icon_url: z.string().optional(),
  is_active: z.boolean(),
});
type CatForm = z.infer<typeof catSchema>;

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

interface SpecRow {
  id?: string;
  spec_key: string;
  spec_label: string;
  spec_type: SpecType;
  spec_options: string;
  is_required: boolean;
  sort_order: number;
}

function buildTree(cats: Category[]): Category[] {
  const map = new Map<string, Category & { children: Category[] }>();
  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Category[] = [];
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });
  return roots;
}

function CategoryTree({
  cats,
  depth,
  selected,
  onSelect,
}: {
  cats: Category[];
  depth: number;
  selected: string | null;
  onSelect: (c: Category) => void;
}) {
  return (
    <ul className={depth > 0 ? 'ml-5 border-l border-gray-200 pl-3' : ''}>
      {cats.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              selected === c.id ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {c.icon_url && <span>{c.icon_url}</span>}
            {c.name}
            {!c.is_active && <span className="text-xs text-gray-400 ml-auto">(inactive)</span>}
          </button>
          {c.children && c.children.length > 0 && (
            <CategoryTree cats={c.children} depth={depth + 1} selected={selected} onSelect={onSelect} />
          )}
        </li>
      ))}
    </ul>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const saveSpecsMutation = useSaveSpecTemplates();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);

  const { data: specTemplates } = useAdminCategorySpecTemplates(selectedCategory?.id ?? null);

  const tree = categories ? buildTree(categories) : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CatForm>({
    resolver: zodResolver(catSchema),
    defaultValues: { is_active: true },
  });

  const handleSelectCategory = (c: Category) => {
    setSelectedCategory(c);
    setEditMode(false);
    // Populate spec rows
    if (specTemplates) {
      setSpecRows(
        specTemplates.map((t: SpecTemplate) => ({
          id: t.id,
          spec_key: t.spec_key,
          spec_label: t.spec_label,
          spec_type: t.spec_type,
          spec_options: t.spec_options?.join(', ') ?? '',
          is_required: t.is_required,
          sort_order: t.sort_order,
        }))
      );
    } else {
      setSpecRows([]);
    }
  };

  // Update spec rows when templates load
  useState(() => {
    if (specTemplates) {
      setSpecRows(
        specTemplates.map((t: SpecTemplate) => ({
          id: t.id,
          spec_key: t.spec_key,
          spec_label: t.spec_label,
          spec_type: t.spec_type,
          spec_options: t.spec_options?.join(', ') ?? '',
          is_required: t.is_required,
          sort_order: t.sort_order,
        }))
      );
    }
  });

  const handleStartAdd = () => {
    setSelectedCategory(null);
    setEditMode(true);
    reset({ name: '', parent_id: '', icon_url: '', is_active: true });
  };

  const handleStartEdit = () => {
    if (!selectedCategory) return;
    setEditMode(true);
    reset({
      name: selectedCategory.name,
      parent_id: selectedCategory.parent_id ?? '',
      icon_url: selectedCategory.icon_url ?? '',
      is_active: selectedCategory.is_active,
    });
  };

  const onCatSubmit = async (data: CatForm) => {
    try {
      const payload = {
        ...data,
        parent_id: data.parent_id || null,
        icon_url: data.icon_url || null,
      };
      if (editMode && selectedCategory) {
        await updateMutation.mutateAsync({ id: selectedCategory.id, data: payload });
        toast.success('Category updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Category created');
      }
      setEditMode(false);
      reset();
    } catch {
      toast.error('Operation failed');
    }
  };

  const addSpecRow = () => {
    setSpecRows((prev) => [
      ...prev,
      {
        spec_key: '',
        spec_label: '',
        spec_type: 'text',
        spec_options: '',
        is_required: false,
        sort_order: prev.length,
      },
    ]);
  };

  const updateSpecRow = (idx: number, field: keyof SpecRow, value: string | boolean | number) => {
    setSpecRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeSpecRow = (idx: number) => {
    setSpecRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSpecs = async () => {
    if (!selectedCategory) return;
    try {
      const templates = specRows.map((r) => ({
        id: r.id,
        spec_key: r.spec_key,
        spec_label: r.spec_label,
        spec_type: r.spec_type,
        spec_options: r.spec_options ? r.spec_options.split(',').map((s) => s.trim()) : null,
        is_required: r.is_required,
        sort_order: r.sort_order,
      }));
      await saveSpecsMutation.mutateAsync({ categoryId: selectedCategory.id, templates });
      toast.success('Spec templates saved');
    } catch {
      toast.error('Failed to save spec templates');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Categories</h2>
        <button
          onClick={handleStartAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Tree */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Category Tree</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No categories yet</p>
          ) : (
            <CategoryTree
              cats={tree}
              depth={0}
              selected={selectedCategory?.id ?? null}
              onSelect={handleSelectCategory}
            />
          )}
        </div>

        {/* Form Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {editMode ? (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {selectedCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <form onSubmit={handleSubmit(onCatSubmit)} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input {...register('name')} className={INPUT_CLS} placeholder="Category name" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Parent Category</label>
                  <select {...register('parent_id')} className={INPUT_CLS}>
                    <option value="">None (top-level)</option>
                    {(categories ?? []).filter((c) => c.id !== selectedCategory?.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Icon (emoji or URL)</label>
                  <input {...register('icon_url')} className={INPUT_CLS} placeholder="e.g. 💻 or https://..." />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="accent-blue-600" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <LoadingSpinner size="sm" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : selectedCategory ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Selected: {selectedCategory.name}</h3>
                <button
                  onClick={handleStartEdit}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Status:</span> {selectedCategory.is_active ? '✅ Active' : '❌ Inactive'}</p>
                {selectedCategory.icon_url && <p><span className="font-medium">Icon:</span> {selectedCategory.icon_url}</p>}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">🏷️</div>
              <p className="text-sm">Select a category to view details, or add a new one</p>
            </div>
          )}
        </div>

        {/* Spec Templates */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Spec Templates</h3>
            {selectedCategory && (
              <button
                onClick={addSpecRow}
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
              >
                + Add Spec
              </button>
            )}
          </div>

          {!selectedCategory ? (
            <p className="text-sm text-gray-400 text-center py-8">Select a category first</p>
          ) : specRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No spec templates. Add one above.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[400px]">
              {specRows.map((row, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2 text-xs">
                  <div className="flex gap-2">
                    <input
                      value={row.spec_key}
                      onChange={(e) => updateSpecRow(idx, 'spec_key', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="key (e.g. ram)"
                    />
                    <input
                      value={row.spec_label}
                      onChange={(e) => updateSpecRow(idx, 'spec_label', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="label (e.g. RAM)"
                    />
                    <button onClick={() => removeSpecRow(idx)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={row.spec_type}
                      onChange={(e) => updateSpecRow(idx, 'spec_type', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                      <option value="boolean">Boolean</option>
                    </select>
                    <label className="flex items-center gap-1 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={row.is_required}
                        onChange={(e) => updateSpecRow(idx, 'is_required', e.target.checked)}
                        className="accent-blue-600"
                      />
                      Required
                    </label>
                  </div>
                  {row.spec_type === 'select' && (
                    <input
                      value={row.spec_options}
                      onChange={(e) => updateSpecRow(idx, 'spec_options', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="Options: 8GB, 16GB, 32GB"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedCategory && specRows.length > 0 && (
            <button
              onClick={() => void handleSaveSpecs()}
              disabled={saveSpecsMutation.isPending}
              className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saveSpecsMutation.isPending && <LoadingSpinner size="sm" />}
              Save Spec Templates
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
