import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Tags, X, Sparkles, Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CsvImportModal } from '../common/CsvImportModal';
import { Product, ProductVariant } from '../../types';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';

interface VariantOption {
  name: string; // e.g., "Size"
  values: string[]; // e.g., ["S", "M", "L"]
}

interface GeneratedVariant {
  name: string;
  price: number;
  total_quantity?: number;
  current_stock?: number;
}

export const StepProductTab: React.FC = () => {
  const session = useStore((s) => s.session);
  const merchantId = session?.merchant?.id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [loading, setLoading] = useState(true);

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: number;
    total_quantity?: number;
    current_stock?: number;
  }>({
    name: '',
    description: '',
    price: 0,
    total_quantity: undefined,
    current_stock: undefined
  });

  // Variant Generation State (inside Product Modal)
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState(''); // Comma separated

  // Single Variant Modal (for editing existing variants or adding single ones)
  const [variantModalFor, setVariantModalFor] = useState<{ productId: string; variantId?: string } | null>(null);
  const [variantDraft, setVariantDraft] = useState<{
    name: string;
    price?: number;
    total_quantity?: number;
    current_stock?: number;
  }>({ name: '', price: 0 });

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    loadProducts();
  }, [merchantId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const prods = await api.getProducts(merchantId);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (productId: string) => {
    const isOpen = expanded[productId];
    const next = { ...expanded, [productId]: !isOpen };
    setExpanded(next);
    if (!isOpen && !variants[productId]) {
      const list = await api.getProductVariants(productId);
      setVariants((v) => ({ ...v, [productId]: list }));
    }
  };

  // --- Product Modal Logic ---

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: 0, total_quantity: undefined, current_stock: undefined });
    setVariantOptions([]);
    setGeneratedVariants([]);
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      total_quantity: p.total_quantity,
      current_stock: p.current_stock
    });
    // Don't pre-fill variant generation options for edit mode to simplify complexity
    // Users can edit variants individually via the main table
    setVariantOptions([]); 
    setGeneratedVariants([]);
    setShowProductModal(true);
  };

  const addVariantOption = () => {
    if (!newOptionName || !newOptionValues) return;
    const values = newOptionValues.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) return;

    const newOptions = [...variantOptions, { name: newOptionName, values }];
    setVariantOptions(newOptions);
    setNewOptionName('');
    setNewOptionValues('');
    generateVariants(newOptions);
  };

  const removeVariantOption = (index: number) => {
    const newOptions = variantOptions.filter((_, i) => i !== index);
    setVariantOptions(newOptions);
    generateVariants(newOptions);
  };

  const generateVariants = (options: VariantOption[]) => {
    if (options.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    // Helper to compute Cartesian product
    const cartesian = (args: string[][]): string[][] => {
      const result: string[][] = [];
      const max = args.length - 1;
      const helper = (arr: string[], i: number) => {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0); // clone arr
          a.push(args[i][j]);
          if (i === max) result.push(a);
          else helper(a, i + 1);
        }
      };
      helper([], 0);
      return result;
    };

    const combinations = cartesian(options.map(o => o.values));
    const newVariants: GeneratedVariant[] = combinations.map(combo => ({
      name: combo.join(' - '),
      price: productForm.price, // Default to product price
      total_quantity: productForm.total_quantity,
      current_stock: productForm.current_stock
    }));
    setGeneratedVariants(newVariants);
  };

  const updateGeneratedVariant = (index: number, field: keyof GeneratedVariant, value: any) => {
    const updated = [...generatedVariants];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedVariants(updated);
  };

  const saveProduct = async () => {
    if (!merchantId || !productForm.name) return;

    try {
      let savedProduct: Product;
      
      if (editingProduct) {
        savedProduct = await api.updateProduct(editingProduct.id, productForm);
        setProducts(products.map(p => p.id === editingProduct.id ? savedProduct : p));
      } else {
        // Create Product
        savedProduct = await api.createProduct(merchantId, {
           ...productForm,
           // Default current_stock to total_quantity if not set
           current_stock: productForm.current_stock ?? productForm.total_quantity
        });
        setProducts([...products, savedProduct]);

        // Create Variants if any
        if (generatedVariants.length > 0) {
          await Promise.all(generatedVariants.map(v => 
            api.createVariant(savedProduct.id, {
              name: v.name,
              price: v.price,
              total_quantity: v.total_quantity,
              current_stock: v.current_stock ?? v.total_quantity
            })
          ));
          // Refresh variants list for this product (empty initially)
          const list = await api.getProductVariants(savedProduct.id);
          setVariants(v => ({ ...v, [savedProduct.id]: list }));
          // Auto expand to show variants
          setExpanded(e => ({ ...e, [savedProduct.id]: true }));
        }
      }

      setShowProductModal(false);
    } catch (err) {
      console.error("Failed to save product", err);
      // TODO: Show error notification
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await api.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  // --- Individual Variant Logic ---

  const openVariantModal = (productId: string, variant?: ProductVariant) => {
    setVariantModalFor({ productId, variantId: variant?.id });
    setVariantDraft({
      name: variant?.name || '',
      price: variant?.price,
      total_quantity: variant?.total_quantity,
      current_stock: variant?.current_stock
    });
  };

  const saveVariantDraft = async () => {
    if (!variantModalFor) return;
    const { productId, variantId } = variantModalFor;
    if (!variantDraft.name) return;

    if (variantId) {
      const updated = await api.updateVariant(variantId, variantDraft);
      setVariants((v) => ({
        ...v,
        [productId]: (v[productId] || []).map(x => x.id === variantId ? updated : x)
      }));
    } else {
      const created = await api.createVariant(productId, variantDraft);
      setVariants((v) => ({
        ...v,
        [productId]: [...(v[productId] || []), created]
      }));
    }
    setVariantModalFor(null);
  };

  const deleteVariant = async (productId: string, id: string) => {
    if (!confirm("Delete this variant?")) return;
    await api.deleteVariant(id);
    setVariants((v) => ({
      ...v,
      [productId]: (v[productId] || []).filter(x => x.id !== id)
    }));
  };

  // --- CSV Import Logic ---

  const handleCsvImport = async (data: any[]) => {
    if (!merchantId) return;

    // Group by Product Name to handle variants
    const productMap = new Map<string, any[]>();
    
    data.forEach(row => {
      const productName = row.name?.trim();
      if (!productName) return;
      if (!productMap.has(productName)) {
        productMap.set(productName, []);
      }
      productMap.get(productName)?.push(row);
    });

    for (const [productName, rows] of productMap) {
      // 1. Create or Find Product
      // For simplicity, we create new product if not exists, or update if exists? 
      // Actually, bulk import usually creates new. Let's assume creating new or finding exact name match.
      // To be safe, let's create new products to avoid overwriting accidentally, or maybe check existing?
      // Checking existing by name is risky (duplicates). Let's create new for now.
      
      const firstRow = rows[0];
      const productData = {
        name: productName,
        description: firstRow.description || '',
        price: parseFloat(firstRow.price || '0'),
        total_quantity: firstRow.total_quantity ? parseInt(firstRow.total_quantity) : undefined,
        current_stock: firstRow.total_quantity ? parseInt(firstRow.total_quantity) : undefined // Default stock to total
      };

      const createdProduct = await api.createProduct(merchantId, productData);

      // 2. Create Variants if variant_name exists
      const variantPromises = rows
        .filter((r: any) => r.variant_name)
        .map((r: any) => api.createVariant(createdProduct.id, {
          name: r.variant_name,
          price: r.variant_price ? parseFloat(r.variant_price) : productData.price,
          total_quantity: r.total_quantity ? parseInt(r.total_quantity) : undefined,
          current_stock: r.total_quantity ? parseInt(r.total_quantity) : undefined
        }));

      if (variantPromises.length > 0) {
        await Promise.all(variantPromises);
      }
    }

    await loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Products</h3>
          <p className="text-sm text-gray-500">Manage your product catalog and variants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <Button size="sm" onClick={openCreateProduct}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Total Qty</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <React.Fragment key={p.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button aria-label="Toggle variants" onClick={() => toggleExpand(p.id)} className="text-gray-500 hover:text-gray-900 p-1 rounded hover:bg-gray-200">
                      {expanded[p.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{p.description}</td>
                  <td className="px-4 py-3 font-medium text-green-700">${p.price}</td>
                  <td className="px-4 py-3">{p.total_quantity ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      (p.current_stock || 0) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {p.current_stock ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEditProduct(p)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
                {expanded[p.id] && (
                  <tr>
                    <td></td>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50 border-t border-b">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-xs uppercase tracking-wider">
                          <Tags className="h-3 w-3" />
                          Variants
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openVariantModal(p.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Variant
                        </Button>
                      </div>
                      <div className="border rounded-md overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr className="text-gray-600">
                              <th className="px-3 py-2 text-left font-medium">Name</th>
                              <th className="px-3 py-2 text-left font-medium">Price</th>
                              <th className="px-3 py-2 text-left font-medium">Total Qty</th>
                              <th className="px-3 py-2 text-left font-medium">Current Stock</th>
                              <th className="px-3 py-2 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(variants[p.id] || []).map(v => (
                              <tr key={v.id} className="hover:bg-blue-50/50">
                                <td className="px-3 py-2">{v.name}</td>
                                <td className="px-3 py-2 text-green-700">${v.price ?? '-'}</td>
                                <td className="px-3 py-2">{v.total_quantity ?? '-'}</td>
                                <td className="px-3 py-2">{v.current_stock ?? '-'}</td>
                                <td className="px-3 py-2 text-right space-x-2">
                                  <button onClick={() => openVariantModal(p.id, v)} className="text-gray-400 hover:text-blue-600"><Edit2 className="h-3 w-3" /></button>
                                  <button onClick={() => deleteVariant(p.id, v.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                </td>
                              </tr>
                            ))}
                            {(variants[p.id] || []).length === 0 && (
                              <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 italic text-xs">No variants yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Tags className="h-8 w-8 text-gray-300 mb-2" />
                    <p>No products added yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Main Product Modal (Create/Edit) */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b pb-2">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500">Product Name</label>
                <input
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Premium T-Shirt"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <textarea
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Price ($)</label>
                <input
                  type="number"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value || '0') })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Total Quantity</label>
                <input
                  type="number"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  value={productForm.total_quantity ?? ''}
                  onChange={(e) => setProductForm({ ...productForm, total_quantity: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Current Stock</label>
                <input
                  type="number"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder={productForm.total_quantity?.toString()}
                  value={productForm.current_stock ?? ''}
                  onChange={(e) => setProductForm({ ...productForm, current_stock: e.target.value ? parseInt(e.target.value) : undefined })}
                />
                <p className="text-[10px] text-gray-400">Defaults to Total Quantity if left blank.</p>
              </div>
            </div>
          </div>

          {/* Variant Generator (Only for new products for now to avoid complexity) */}
          {!editingProduct && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Variant Generator
              </h4>
              
              <div className="bg-purple-50 p-4 rounded-md space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-medium text-purple-800">Option Name</label>
                    <input 
                      className="block w-full rounded border-purple-200 px-2 py-1 text-sm" 
                      placeholder="e.g. Size" 
                      value={newOptionName}
                      onChange={e => setNewOptionName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 flex-[2]">
                    <label className="text-xs font-medium text-purple-800">Values (comma separated)</label>
                    <input 
                      className="block w-full rounded border-purple-200 px-2 py-1 text-sm" 
                      placeholder="e.g. S, M, L, XL" 
                      value={newOptionValues}
                      onChange={e => setNewOptionValues(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addVariantOption()}
                    />
                  </div>
                  <Button size="sm" onClick={addVariantOption} disabled={!newOptionName || !newOptionValues}>Add</Button>
                </div>

                {/* List of Options */}
                {variantOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variantOptions.map((opt, idx) => (
                      <div key={idx} className="bg-white border border-purple-100 rounded px-2 py-1 text-xs flex items-center gap-2">
                        <span className="font-semibold text-purple-900">{opt.name}:</span>
                        <span className="text-gray-600">{opt.values.join(', ')}</span>
                        <button onClick={() => removeVariantOption(idx)} className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generated Variants Preview */}
              {generatedVariants.length > 0 && (
                <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Variant Name</th>
                        <th className="px-3 py-2 w-20">Price</th>
                        <th className="px-3 py-2 w-20">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {generatedVariants.map((gv, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">{gv.name}</td>
                          <td className="px-3 py-2">
                            <input 
                              type="number" 
                              className="w-full border-none bg-transparent p-0 text-right focus:ring-0" 
                              value={gv.price}
                              onChange={e => updateGeneratedVariant(idx, 'price', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="px-3 py-2">
                             <input 
                              type="number" 
                              className="w-full border-none bg-transparent p-0 text-right focus:ring-0" 
                              value={gv.current_stock ?? ''}
                              placeholder={gv.total_quantity?.toString()}
                              onChange={e => updateGeneratedVariant(idx, 'current_stock', parseInt(e.target.value))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowProductModal(false)}>Cancel</Button>
            <Button onClick={saveProduct}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Variant Modal */}
      <Modal
        isOpen={!!variantModalFor}
        onClose={() => setVariantModalFor(null)}
        title={variantModalFor?.variantId ? 'Edit Variant' : 'Add Single Variant'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Name</label>
            <input
              className="block w-full rounded-md border px-3 py-2"
              value={variantDraft.name}
              onChange={(e) => setVariantDraft({ ...variantDraft, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Price</label>
              <input
                type="number"
                className="block w-full rounded-md border px-3 py-2"
                value={variantDraft.price ?? ''}
                onChange={(e) => setVariantDraft({ ...variantDraft, price: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Total Qty</label>
              <input
                type="number"
                className="block w-full rounded-md border px-3 py-2"
                value={variantDraft.total_quantity ?? ''}
                onChange={(e) => setVariantDraft({ ...variantDraft, total_quantity: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Stock</label>
              <input
                type="number"
                className="block w-full rounded-md border px-3 py-2"
                value={variantDraft.current_stock ?? ''}
                onChange={(e) => setVariantDraft({ ...variantDraft, current_stock: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={saveVariantDraft}>Save Variant</Button>
          </div>
        </div>
      </Modal>

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Products & Variants"
        templateData={[
          { name: 'T-Shirt', description: 'Cotton T-Shirt', price: 20, total_quantity: 100, variant_name: 'Red - S', variant_price: 20 },
          { name: 'T-Shirt', description: 'Cotton T-Shirt', price: 20, total_quantity: 100, variant_name: 'Red - M', variant_price: 22 },
          { name: 'Jeans', description: 'Blue Denim', price: 50, total_quantity: 50, variant_name: '', variant_price: '' }
        ]}
        templateFilename="products_template.csv"
        requiredFields={['name', 'price']}
        onImport={handleCsvImport}
      />
    </div>
  );
};
