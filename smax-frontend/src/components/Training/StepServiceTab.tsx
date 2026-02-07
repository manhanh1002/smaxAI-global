import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Link as LinkIcon, Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CsvImportModal } from '../common/CsvImportModal';
import { Service, ServiceAddon } from '../../types';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';

export const StepServiceTab: React.FC = () => {
  const session = useStore((s) => s.session);
  const merchantId = session?.merchant?.id || '';

  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<(ServiceAddon & { parent_service_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<{ name: string; description: string; price: number }>({
    name: '', description: '', price: 0
  });

  // Addon Modal State
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ServiceAddon | null>(null);
  const [addonForm, setAddonForm] = useState<{
    name: string;
    description: string;
    price: number;
    service_id: string;
  }>({
    name: '', description: '', price: 0, service_id: ''
  });

  // CSV Import State
  const [importType, setImportType] = useState<'service' | 'addon' | null>(null);

  const loadData = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const servs = await api.getServices(merchantId);
      setServices(servs);

      // Fetch addons for all services
      // Note: This is n+1 but okay for small datasets. Ideally optimize with a single query.
      const allAddons: (ServiceAddon & { parent_service_name?: string })[] = [];
      await Promise.all(servs.map(async (s) => {
        const sAddons = await api.getServiceAddons(s.id);
        sAddons.forEach(a => {
          allAddons.push({ ...a, parent_service_name: s.name });
        });
      }));
      setAddons(allAddons);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [merchantId]);

  // --- Service Logic ---

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm({ name: '', description: '', price: 0 });
    setShowServiceModal(true);
  };

  const openEditService = (s: Service) => {
    setEditingService(s);
    setServiceForm({ name: s.name, description: s.description || '', price: s.price });
    setShowServiceModal(true);
  };

  const saveService = async () => {
    if (!merchantId || !serviceForm.name) return;
    try {
      if (editingService) {
        await api.updateService(editingService.id, serviceForm);
      } else {
        await api.createService(merchantId, serviceForm);
      }
      setShowServiceModal(false);
      loadData(); // Reload to refresh everything
    } catch (err) {
      console.error(err);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service? This will also delete its addons.")) return;
    await api.deleteService(id);
    loadData();
  };

  // --- Addon Logic ---

  const openCreateAddon = () => {
    setEditingAddon(null);
    setAddonForm({ name: '', description: '', price: 0, service_id: services[0]?.id || '' });
    setShowAddonModal(true);
  };

  const openEditAddon = (a: ServiceAddon) => {
    setEditingAddon(a);
    setAddonForm({ name: a.name, description: a.description || '', price: a.price, service_id: a.service_id });
    setShowAddonModal(true);
  };

  const saveAddon = async () => {
    if (!addonForm.service_id || !addonForm.name) return;
    try {
      if (editingAddon) {
        await api.updateServiceAddon(editingAddon.id, {
          name: addonForm.name,
          description: addonForm.description,
          price: addonForm.price
          // service_id cannot be changed easily via update in some APIs, assuming it's fixed or we need to handle it.
          // But our API allows partial updates. However, changing parent might be weird if not handled.
          // Let's assume we can update it if the backend allows.
        });
      } else {
        await api.createServiceAddon(addonForm.service_id, {
          name: addonForm.name,
          description: addonForm.description,
          price: addonForm.price
        });
      }
      setShowAddonModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAddon = async (id: string) => {
    if (!confirm("Delete this addon?")) return;
    await api.deleteServiceAddon(id);
    loadData();
  };

  // --- CSV Import Logic ---

  const handleServiceImport = async (data: any[]) => {
    if (!merchantId) return;
    const promises = data.map(async (row) => {
      if (!row.name) return;
      await api.createService(merchantId, {
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price || '0')
        // duration_minutes handling if API supports it, currently types.ts Service doesn't show it explicitly in this file context but it was in plan.
        // Assuming createService handles it or it's not in the visible interface yet. 
        // Let's stick to what createService expects.
      });
    });
    await Promise.all(promises);
    await loadData();
  };

  const handleAddonImport = async (data: any[]) => {
    // We need to map service_name to service_id
    // First, ensure we have latest services
    const currentServices = await api.getServices(merchantId);
    const serviceMap = new Map(currentServices.map(s => [s.name.toLowerCase(), s.id]));

    const promises = data.map(async (row) => {
      const serviceName = row.service_name?.trim().toLowerCase();
      const serviceId = serviceMap.get(serviceName);
      
      if (!serviceId || !row.name) return; // Skip if service not found or addon name missing

      await api.createServiceAddon(serviceId, {
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price || '0')
      });
    });

    await Promise.all(promises);
    await loadData();
  };

  return (
    <div className="space-y-10">
      {/* Main Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Services</h3>
            <p className="text-sm text-gray-500">Main services offered to customers.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportType('service')}>
              <Upload className="h-4 w-4 mr-2" /> Import Services
            </Button>
            <Button size="sm" onClick={openCreateService}>
              <Plus className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{s.description}</td>
                  <td className="px-4 py-3 font-medium text-green-700">${s.price}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEditService(s)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteService(s.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No services found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Add-on Services</h3>
            <p className="text-sm text-gray-500">Extra services linked to main services.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportType('addon')} disabled={services.length === 0}>
              <Upload className="h-4 w-4 mr-2" /> Import Add-ons
            </Button>
            <Button size="sm" variant="outline" onClick={openCreateAddon} disabled={services.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Add Add-on
            </Button>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Add-on Name</th>
                <th className="px-4 py-3 text-left">Parent Service</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {addons.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                    <LinkIcon className="h-3 w-3 text-gray-400" />
                    {a.parent_service_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-700">${a.price}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEditAddon(a)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteAddon(a.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {addons.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No add-ons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title={editingService ? 'Edit Service' : 'Create New Service'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Service Name</label>
            <input
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Description</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Price ($)</label>
            <input
              type="number"
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
              value={serviceForm.price}
              onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value || '0') })}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={saveService}>Save Service</Button>
          </div>
        </div>
      </Modal>

      {/* Add-on Modal */}
      <Modal
        isOpen={showAddonModal}
        onClose={() => setShowAddonModal(false)}
        title={editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Parent Service</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
              value={addonForm.service_id}
              onChange={(e) => setAddonForm({ ...addonForm, service_id: e.target.value })}
              disabled={!!editingAddon} // Maybe disable changing parent to avoid confusion? Or allow it.
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Add-on Name</label>
            <input
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
              value={addonForm.name}
              onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Description</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={2}
              value={addonForm.description}
              onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Price ($)</label>
            <input
              type="number"
              className="block w-full rounded-md border border-gray-300 px-3 py-2"
              value={addonForm.price}
              onChange={(e) => setAddonForm({ ...addonForm, price: parseFloat(e.target.value || '0') })}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={saveAddon}>Save Add-on</Button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modals */}
      <CsvImportModal
        isOpen={importType === 'service'}
        onClose={() => setImportType(null)}
        title="Import Services"
        templateData={[
          { name: 'Basic Facial', description: '30 min facial', price: 50 },
          { name: 'Full Body Massage', description: '60 min massage', price: 80 }
        ]}
        templateFilename="services_template.csv"
        requiredFields={['name', 'price']}
        onImport={handleServiceImport}
      />

      <CsvImportModal
        isOpen={importType === 'addon'}
        onClose={() => setImportType(null)}
        title="Import Add-ons"
        templateData={[
          { service_name: 'Basic Facial', name: 'Eye Mask', description: 'Cooling eye mask', price: 10 },
          { service_name: 'Full Body Massage', name: 'Aroma Oil', description: 'Lavender oil', price: 15 }
        ]}
        templateFilename="addons_template.csv"
        requiredFields={['service_name', 'name', 'price']}
        onImport={handleAddonImport}
      />
    </div>
  );
};
