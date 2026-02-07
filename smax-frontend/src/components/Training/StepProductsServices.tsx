import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Tags } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Product, ProductVariant, Service } from '../../types';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';

export const StepProductsServices: React.FC = () => {
  const session = useStore((s) => s.session);
  const merchantId = session?.merchant?.id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [loading, setLoading] = useState(true);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<{ name: string; description?: string; price: number; total_quantity?: number; current_stock?: number; }>({
    name: '',
    description: '',
    price: 0,
    total_quantity: undefined,
    current_stock: undefined
  });

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<{ name: string; description?: string; price: number }>({
    name: '',
    description: '',
    price: 0
  });

  const [variantDrafts, setVariantDrafts] = useState<Record<string, { id?: string; name: string; price?: number; total_quantity?: number; current_stock?: number }>>({});
  const [variantModalFor, setVariantModalFor] = useState<{ productId: string; variantId?: string } | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [prods, servs] = await Promise.all([
          api.getProducts(merchantId),
          api.getServices(merchantId)
        ]);
        setProducts(prods);
        setServices(servs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [merchantId]);

  const toggleExpand = async (productId: string) => {
    const isOpen = expanded[productId];
    const next = { ...expanded, [productId]: !isOpen };
    setExpanded(next);
    if (!isOpen && !variants[productId]) {
      const list = await api.getProductVariants(productId);
      setVariants((v) => ({ ...v, [productId]: list }));
    }
  };

  const saveProduct = async () => {
    if (!merchantId || !newProduct.name) return;
    if (editingProduct) {
      const updated = await api.updateProduct(editingProduct.id, {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        total_quantity: newProduct.total_quantity,
        current_stock: newProduct.current_stock
      });
      setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
    } else {
      const created = await api.createProduct(merchantId, newProduct);
      setProducts([...products, created]);
    }
    setEditingProduct(null);
    setNewProduct({ name: '', description: '', price: 0, total_quantity: undefined, current_stock: undefined });
    setShowProductForm(false);
  };

  const deleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name,
      description: p.description,
      price: p.price,
      total_quantity: p.total_quantity,
      current_stock: p.current_stock
    });
    setShowProductForm(true);
  };

  const openVariantModal = (productId: string, variant?: ProductVariant) => {
    setVariantModalFor({ productId, variantId: variant?.id });
    setVariantDrafts((d) => ({
      ...d,
      [productId]: {
        id: variant?.id,
        name: variant?.name || '',
        price: variant?.price,
        total_quantity: variant?.total_quantity,
        current_stock: variant?.current_stock
      }
    }));
  };

  const saveVariant = async () => {
    if (!variantModalFor) return;
    const { productId, variantId } = variantModalFor;
    const draft = variantDrafts[productId];
    if (!draft?.name) return;
    if (variantId) {
      const updated = await api.updateVariant(variantId, {
        name: draft.name,
        price: draft.price,
        total_quantity: draft.total_quantity,
        current_stock: draft.current_stock
      });
      setVariants((v) => ({
        ...v,
        [productId]: (v[productId] || []).map(x => x.id === variantId ? updated : x)
      }));
    } else {
      const created = await api.createVariant(productId, {
        name: draft.name,
        price: draft.price,
        total_quantity: draft.total_quantity,
        current_stock: draft.current_stock
      });
      setVariants((v) => ({
        ...v,
        [productId]: [...(v[productId] || []), created]
      }));
    }
    setVariantModalFor(null);
  };

  const deleteVariant = async (productId: string, id: string) => {
    await api.deleteVariant(id);
    setVariants((v) => ({
      ...v,
      [productId]: (v[productId] || []).filter(x => x.id !== id)
    }));
  };

  const saveService = async () => {
    if (!merchantId || !newService.name) return;
    if (editingService) {
      const updated = await api.updateService(editingService.id, {
        name: newService.name,
        description: newService.description,
        price: newService.price
      });
      setServices(services.map(s => s.id === editingService.id ? updated : s));
    } else {
      const created = await api.createService(merchantId, newService);
      setServices([...services, created]);
    }
    setEditingService(null);
    setNewService({ name: '', description: '', price: 0 });
    setShowServiceForm(false);
  };

  const deleteService = async (id: string) => {
    await api.deleteService(id);
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Products</h3>
          <Button size="sm" variant="outline" onClick={() => { setEditingProduct(null); setShowProductForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Total Qty</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button aria-label="Toggle variants" onClick={() => toggleExpand(p.id)} className="text-gray-500 hover:text-gray-900">
                        {expanded[p.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.description}</td>
                    <td className="px-4 py-3">${p.price}</td>
                    <td className="px-4 py-3">{p.total_quantity ?? '-'}</td>
                    <td className="px-4 py-3">{p.current_stock ?? '-'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEditProduct(p)} className="text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                  {expanded[p.id] && (
                    <tr>
                      <td></td>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <Tags className="h-4 w-4" />
                            Variants
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openVariantModal(p.id)}>
                            <Plus className="h-4 w-4 mr-1" /> Add Variant
                          </Button>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-white">
                              <tr className="text-gray-600">
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Price</th>
                                <th className="px-3 py-2">Total Qty</th>
                                <th className="px-3 py-2">Current Stock</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {(variants[p.id] || []).map(v => (
                                <tr key={v.id} className="bg-white hover:bg-gray-50">
                                  <td className="px-3 py-2">{v.name}</td>
                                  <td className="px-3 py-2">{v.price ?? '-'}</td>
                                  <td className="px-3 py-2">{v.total_quantity ?? '-'}</td>
                                  <td className="px-3 py-2">{v.current_stock ?? '-'}</td>
                                  <td className="px-3 py-2 text-right space-x-2">
                                    <button onClick={() => openVariantModal(p.id, v)} className="text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => deleteVariant(p.id, v.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                  </td>
                                </tr>
                              ))}
                              {(variants[p.id] || []).length === 0 && (
                                <tr><td colSpan={5} className="px-3 py-3 text-center text-gray-500">No variants.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No products added.</td>
                </tr>
              )}
            </tbody>
          </table>
          {showProductForm && (
            <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-4 items-end">
              <div className="space-y-1 min-w-[220px] flex-1">
                <label className="text-xs font-medium text-gray-500">Name</label>
                <input className="block w-full rounded-md border px-3 py-2" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              </div>
              <div className="space-y-1 min-w-[280px] flex-1">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <input className="block w-full rounded-md border px-3 py-2" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
              </div>
              <div className="space-y-1 w-28">
                <label className="text-xs font-medium text-gray-500">Price</label>
                <input type="number" className="block w-full rounded-md border px-3 py-2" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value || '0') })} />
              </div>
              <div className="space-y-1 w-28">
                <label className="text-xs font-medium text-gray-500">Total Qty</label>
                <input type="number" className="block w-full rounded-md border px-3 py-2" value={newProduct.total_quantity ?? ''} onChange={(e) => setNewProduct({ ...newProduct, total_quantity: e.target.value === '' ? undefined : parseInt(e.target.value) })} />
              </div>
              <div className="space-y-1 w-28">
                <label className="text-xs font-medium text-gray-500">Stock</label>
                <input type="number" className="block w-full rounded-md border px-3 py-2" value={newProduct.current_stock ?? ''} onChange={(e) => setNewProduct({ ...newProduct, current_stock: e.target.value === '' ? undefined : parseInt(e.target.value) })} />
              </div>
              <Button size="sm" onClick={saveProduct}>Save</Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Services</h3>
          <Button size="sm" variant="outline" onClick={() => { setEditingService(null); setShowServiceForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Service
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.description}</td>
                  <td className="px-4 py-3">${s.price}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditingService(s); setNewService({ name: s.name, description: s.description, price: s.price }); setShowServiceForm(true); }} className="text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteService(s.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No services added.</td>
                </tr>
              )}
            </tbody>
          </table>
          {showServiceForm && (
            <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-4 items-end">
              <div className="space-y-1 min-w-[220px] flex-1">
                <label className="text-xs font-medium text-gray-500">Name</label>
                <input className="block w-full rounded-md border px-3 py-2" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
              </div>
              <div className="space-y-1 min-w-[280px] flex-1">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <input className="block w-full rounded-md border px-3 py-2" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
              </div>
              <div className="space-y-1 w-28">
                <label className="text-xs font-medium text-gray-500">Price</label>
                <input type="number" className="block w-full rounded-md border px-3 py-2" value={newService.price} onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value || '0') })} />
              </div>
              <Button size="sm" onClick={saveService}>Save</Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!variantModalFor}
        onClose={() => setVariantModalFor(null)}
        title={variantModalFor?.variantId ? 'Edit Variant' : 'Add Variant'}
      >
        {variantModalFor && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Name</label>
              <input
                className="block w-full rounded-md border px-3 py-2"
                value={variantDrafts[variantModalFor.productId]?.name || ''}
                onChange={(e) => setVariantDrafts((d) => ({
                  ...d,
                  [variantModalFor.productId]: { ...d[variantModalFor.productId], name: e.target.value }
                }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Price</label>
                <input
                  type="number"
                  className="block w-full rounded-md border px-3 py-2"
                  value={variantDrafts[variantModalFor.productId]?.price ?? ''}
                  onChange={(e) => setVariantDrafts((d) => ({
                    ...d,
                    [variantModalFor.productId]: { ...d[variantModalFor.productId], price: e.target.value === '' ? undefined : parseFloat(e.target.value) }
                  }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Total Qty</label>
                <input
                  type="number"
                  className="block w-full rounded-md border px-3 py-2"
                  value={variantDrafts[variantModalFor.productId]?.total_quantity ?? ''}
                  onChange={(e) => setVariantDrafts((d) => ({
                    ...d,
                    [variantModalFor.productId]: { ...d[variantModalFor.productId], total_quantity: e.target.value === '' ? undefined : parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Stock</label>
                <input
                  type="number"
                  className="block w-full rounded-md border px-3 py-2"
                  value={variantDrafts[variantModalFor.productId]?.current_stock ?? ''}
                  onChange={(e) => setVariantDrafts((d) => ({
                    ...d,
                    [variantModalFor.productId]: { ...d[variantModalFor.productId], current_stock: e.target.value === '' ? undefined : parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveVariant}>Save Variant</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
