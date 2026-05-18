import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Save,
  Trash2,
  X,
  Edit2,
  Layers,
  Settings,
} from 'lucide-react';
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

interface SpecRow {
  id?: string;
  spec_key: string;
  spec_label: string;
  spec_type: SpecType;
  spec_options: string;
  is_required: boolean;
  sort_order: number;
}

// --- Helper Functions ---

function buildTree(cats: Category[]): Category[] {
  const map = new Map<string, Category & { children: Category[] }>();
  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Category[] = [];
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id) && cat.parent_id !== cat.id) {
      map.get(cat.parent_id)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });
  return roots;
}


// --- Components ---

function TreeItem({
  cat,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  searchTerm,
}: {
  cat: Category;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (c: Category) => void;
  onToggle: (id: string) => void;
  searchTerm: string;
}) {
  const isExpanded = expandedIds.has(cat.id);
  const isSelected = selectedId === cat.id;
  const hasChildren = cat.children && cat.children.length > 0;

  // Filter visibility based on search
  const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
  const childMatches = cat.children?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.children && c.children.length > 0));

  if (searchTerm && !matchesSearch && !childMatches) return null;

  return (
    <div>
      <div
        className={`group flex items-center py-1.5 px-2 cursor-pointer rounded-md transition-all ${isSelected
          ? 'bg-amazon-blue/10 text-amazon-blue border-l-4 border-amazon-blue pl-1'
          : 'hover:bg-gray-100 text-gray-700'
          }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        onClick={() => onSelect(cat)}
      >
        <button
          className="p-1 hover:bg-gray-200 rounded text-gray-400"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(cat.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-3.5" />
          )}
        </button>
        <div className={`mr-2 ${isSelected ? 'text-amazon-blue' : 'text-gray-400 group-hover:text-gray-500'}`}>
          {hasChildren ? (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />) : <Layers size={16} />}
        </div>
        <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
          {cat.name}
        </span>
        {!cat.is_active && <span className="ml-2 text-[10px] uppercase font-bold text-gray-400">Hidden</span>}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {cat.children!.map((child) => (
            <TreeItem
              key={child.id}
              cat={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { data: specTemplates } = useAdminCategorySpecTemplates(selectedCategory?.id ?? null);

  const tree = useMemo(() => (categories ? buildTree(categories) : []), [categories]);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CatForm>({
    resolver: zodResolver(catSchema),
    defaultValues: { is_active: true },
  });

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectCategory = (c: Category) => {
    setSelectedCategory(c);
    setEditMode(false);
  };

  // Sync specs when templates load or selection changes
  useEffect(() => {
    if (specTemplates && Array.isArray(specTemplates)) {
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
    } else if (selectedCategory) {
      setSpecRows([]);
    }
  }, [specTemplates, selectedCategory?.id]);

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

  const updateSpecRow = (idx: number, field: keyof SpecRow, value: any) => {
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Action Header Row */}
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-amazon-navy tracking-tight">Manage Categories</h1>
          <button
            onClick={handleStartAdd}
            className="flex items-center gap-2 px-6 py-2 bg-amazon-orange text-white rounded-md text-sm font-bold hover:bg-amazon-orangeLight shadow-md transition-all active:scale-95"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 md:p-6 gap-4 md:gap-6 bg-amazon-gray">
        {/* Left Column: Category Browser */}
        <div className="w-full lg:w-80 h-[40vh] lg:h-auto bg-white rounded-lg border border-gray-200 flex flex-col shadow-sm flex-shrink-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Folder size={18} className="text-amazon-blue" />
              Categories
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amazon-blue focus:border-amazon-blue transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded-md animate-pulse" />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No categories found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tree.map((cat) => (
                  <TreeItem
                    key={cat.id}
                    cat={cat}
                    depth={0}
                    selectedId={selectedCategory?.id ?? null}
                    expandedIds={expandedIds}
                    onSelect={handleSelectCategory}
                    onToggle={handleToggleExpand}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Editor / Detail */}
        <div className="flex-1 min-h-[50vh] bg-white rounded-lg border border-gray-200 flex flex-col shadow-sm overflow-hidden">
          {editMode ? (
            <div className="p-8 max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedCategory ? <Edit2 size={20} className="text-amazon-blue" /> : <Plus size={20} className="text-amazon-blue" />}
                  {selectedCategory ? `Edit: ${selectedCategory.name}` : 'Create New Category'}
                </h3>
                <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onCatSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Category Name *</label>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amazon-blue outline-none"
                    placeholder="e.g. Laptops, Audio Gear"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Parent Category</label>
                  <select
                    {...register('parent_id')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amazon-blue outline-none appearance-none bg-no-repeat bg-[right_1rem_center]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem' }}
                  >
                    <option value="">Top Level (Root)</option>
                    {(categories ?? [])
                      .filter((c) => c.id !== selectedCategory?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Icon / Emoji</label>
                  <input
                    {...register('icon_url')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amazon-blue outline-none"
                    placeholder="e.g. 💻 or image URL"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    id="is_active"
                    className="w-5 h-5 accent-amazon-blue rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Active (visible to customers)
                  </label>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-amazon-orange text-white rounded-md text-sm font-bold hover:bg-amazon-orangeLight shadow-md disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" /> : <Save size={18} />}
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedCategory ? (
            <div className="flex flex-col h-full">
              {/* Category Overview Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h3>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-black rounded ${selectedCategory.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedCategory.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">ID: <span className="font-mono">{selectedCategory.id}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartEdit}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
                    >
                      <Edit2 size={16} />
                      Edit Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs / Sub-sections */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="flex border-b border-gray-200 px-6">
                  <button className="px-4 py-3 text-sm font-bold border-b-2 border-amazon-orange text-amazon-orange">
                    Attributes
                  </button>
                  <button className="px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">
                    Settings
                  </button>
                  <button className="px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">
                    Audit Logs
                  </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Attribute Definitions</h4>
                      <p className="text-xs text-gray-500">Define specifications required for products in this category</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addSpecRow}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amazon-blue text-white rounded text-xs font-bold hover:bg-amazon-blue/90"
                      >
                        <Plus size={14} />
                        Add Attribute
                      </button>
                      <button
                        onClick={() => void handleSaveSpecs()}
                        disabled={saveSpecsMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-amazon-orange text-white rounded text-xs font-bold hover:bg-amazon-orangeLight disabled:opacity-60 shadow-sm"
                      >
                        {saveSpecsMutation.isPending ? <LoadingSpinner size="sm" /> : <Save size={14} />}
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6 pt-2">
                    {specRows.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Settings size={32} className="text-gray-300" />
                        </div>
                        <h5 className="text-sm font-bold text-gray-900">No attributes defined</h5>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                          Click "Add Attribute" to start defining technical specifications for products.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px] text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 uppercase text-gray-500 font-bold">
                                <th className="px-4 py-3">Attribute Name / Key</th>
                                <th className="px-4 py-3">Data Type</th>
                                <th className="px-4 py-3">Mandatory</th>
                                <th className="px-4 py-3">Value Options</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {specRows.map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="space-y-1.5">
                                      <input
                                        value={row.spec_label}
                                        onChange={(e) => updateSpecRow(idx, 'spec_label', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-amazon-blue outline-none font-bold"
                                        placeholder="e.g. RAM Size"
                                      />
                                      <input
                                        value={row.spec_key}
                                        onChange={(e) => updateSpecRow(idx, 'spec_key', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-200 rounded focus:border-amazon-blue outline-none text-[10px] font-mono text-gray-400"
                                        placeholder="ram_size"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <select
                                      value={row.spec_type}
                                      onChange={(e) => updateSpecRow(idx, 'spec_type', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-amazon-blue outline-none bg-white"
                                    >
                                      <option value="text">Text Field</option>
                                      <option value="number">Numeric</option>
                                      <option value="select">Dropdown</option>
                                      <option value="boolean">Checkbox</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <div className={`w-8 h-4 rounded-full relative transition-colors ${row.is_required ? 'bg-amazon-blue' : 'bg-gray-200'}`}>
                                        <input
                                          type="checkbox"
                                          className="sr-only"
                                          checked={row.is_required}
                                          onChange={(e) => updateSpecRow(idx, 'is_required', e.target.checked)}
                                        />
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${row.is_required ? 'translate-x-4' : ''}`} />
                                      </div>
                                      <span className={row.is_required ? 'text-amazon-blue font-bold' : 'text-gray-400'}>
                                        {row.is_required ? 'Required' : 'Optional'}
                                      </span>
                                    </label>
                                  </td>
                                  <td className="px-4 py-3">
                                    {row.spec_type === 'select' ? (
                                      <textarea
                                        value={row.spec_options}
                                        onChange={(e) => updateSpecRow(idx, 'spec_options', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded focus:border-amazon-blue outline-none resize-none text-[10px]"
                                        rows={2}
                                        placeholder="Enter options separated by commas (e.g. 8GB, 16GB)"
                                      />
                                    ) : (
                                      <span className="text-gray-300 italic">N/A for {row.spec_type}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => removeSpecRow(idx)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Category Selected</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select a category from the tree on the left to manage its attributes, or click "Add Category" to create a new classification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
