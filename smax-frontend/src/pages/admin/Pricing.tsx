import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const AdminPricing: React.FC = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [baseRate, setBaseRate] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formCredits, setFormCredits] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Packages
      const { data: pkgData } = await supabase.from('credit_packages').select('*').order('credits', { ascending: true });
      setPackages(pkgData || []);

      // Fetch Base Rate
      const { data: rateData } = await supabase.from('system_settings').select('value').eq('key', 'credit_price_usd_per_1k').single();
      if (rateData?.value) setBaseRate(Number(rateData.value));
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async () => {
    const newRate = prompt('Enter new USD price per 1,000 credits:', baseRate.toString());
    if (newRate && !isNaN(Number(newRate))) {
      await supabase
        .from('system_settings')
        .update({ value: Number(newRate) })
        .eq('key', 'credit_price_usd_per_1k');
      fetchData();
    }
  };

  const openModal = (pkg: any = null) => {
    setEditingPkg(pkg);
    setFormName(pkg?.name || '');
    setFormCredits(pkg?.credits || '');
    setFormPrice(pkg?.price_usd || '');
    setFormDesc(pkg?.description || '');
    setIsModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      credits: Number(formCredits),
      price_usd: Number(formPrice),
      description: formDesc
    };

    if (editingPkg) {
      await supabase.from('credit_packages').update(payload).eq('id', editingPkg.id);
    } else {
      await supabase.from('credit_packages').insert(payload);
    }
    
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      await supabase.from('credit_packages').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-500 mt-2">Manage credit packages and conversion rates.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Add Package
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Global Conversion Rate</h3>
            <p className="text-sm text-gray-500">The base rate used for ad-hoc credit calculations.</p>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-2xl font-bold text-gray-900">${baseRate} <span className="text-sm font-normal text-gray-500">/ 1k credits</span></span>
             <Button variant="outline" size="sm" onClick={handleUpdateRate}>Edit</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-6 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => openModal(pkg)} className="p-2 bg-gray-100 rounded-full hover:bg-blue-100 text-blue-600">
                 <Edit2 className="w-4 h-4" />
               </button>
               <button onClick={() => handleDelete(pkg.id)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 text-red-600">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{pkg.description}</p>
            
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">${pkg.price_usd}</span>
              <span className="text-gray-500">USD</span>
            </div>

            <div className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
              {pkg.credits.toLocaleString()} Credits
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPkg ? 'Edit Package' : 'New Package'}>
         <form onSubmit={handleSavePackage} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700">Package Name</label>
               <input className="mt-1 w-full border rounded-md p-2" value={formName} onChange={e => setFormName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Credits</label>
                 <input type="number" className="mt-1 w-full border rounded-md p-2" value={formCredits} onChange={e => setFormCredits(e.target.value)} required />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                 <input type="number" className="mt-1 w-full border rounded-md p-2" value={formPrice} onChange={e => setFormPrice(e.target.value)} required />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Description</label>
               <input className="mt-1 w-full border rounded-md p-2" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
               <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button type="submit">Save Package</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};
