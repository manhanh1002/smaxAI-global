import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Calendar, Clock, Check, ShoppingBag } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { BookingSlot, FAQ, Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';

interface StepTrainingDataProps {
  onNext: () => void;
  onBack: () => void;
}

export const StepTrainingData: React.FC<StepTrainingDataProps> = ({ onNext, onBack }) => {
  const session = useStore((state) => state.session);
  const merchantId = session?.merchant?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [, setLoading] = useState(true);

  // Fetch Data on Mount
  useEffect(() => {
    if (!merchantId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, slotsRes, faqsRes] = await Promise.all([
          supabase.from('products').select('*').eq('merchant_id', merchantId),
          supabase.from('booking_slots').select('*').eq('merchant_id', merchantId).order('date', { ascending: true }),
          supabase.from('faqs').select('*').eq('merchant_id', merchantId)
        ]);

        if (productsRes.data) setProducts(productsRes.data);
        if (slotsRes.data) setSlots(slotsRes.data);
        if (faqsRes.data) setFaqs(faqsRes.data);
      } catch (error) {
        console.error('Error fetching training data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantId]);

  // UI State
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSlot, setEditingSlot] = useState<BookingSlot | null>(null);

  // Forms
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0 });
  const [newSlot, setNewSlot] = useState({ date: '', time: '', capacity: 1, duration_minutes: 60 });
  const [faqForm, setFaqForm] = useState({ category: 'policies', question: '', answer: '' });

  // Product Handlers
  const handleSaveProduct = async () => {
    // 1. Re-validate Merchant ID from latest state
    const currentSession = useStore.getState().session;
    const currentMerchantId = currentSession?.merchant?.id;

    if (!currentMerchantId) {
      alert("Session invalid or expired. Attempting to refresh...");
      await useStore.getState().validateSession();
      return;
    }

    if (!newProduct.name) {
      alert("Product name is required.");
      return;
    }
    if (isNaN(newProduct.price) || newProduct.price < 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      if (editingProduct) {
        const { data, error } = await supabase.from('products').update({
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price
        }).eq('id', editingProduct.id).select().single();

        if (error) throw error;
        if (data) setProducts(products.map(p => p.id === editingProduct.id ? data : p));
      } else {
        const { data, error } = await supabase.from('products').insert({
          merchant_id: currentMerchantId,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price
        }).select().single();

        if (error) throw error;
        if (data) setProducts([...products, data]);
      }
      
      setNewProduct({ name: '', description: '', price: 0 });
      setEditingProduct(null);
      setShowProductForm(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(`Failed to save product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ 
      name: product.name, 
      description: product.description || '', 
      price: product.price 
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Slot Handlers
  const handleSaveSlot = async () => {
    // 1. Re-validate Merchant ID from latest state
    const currentSession = useStore.getState().session;
    const currentMerchantId = currentSession?.merchant?.id;

    if (!currentMerchantId) {
      alert("Session invalid or expired. Attempting to refresh...");
      await useStore.getState().validateSession();
      return;
    }

    if (!newSlot.date || !newSlot.time) {
      alert("Date and Time are required.");
      return;
    }
    
    try {
      if (editingSlot) {
        const { data, error } = await supabase.from('booking_slots').update({
          date: newSlot.date,
          time: newSlot.time,
          capacity: newSlot.capacity
        }).eq('id', editingSlot.id).select().single();

        if (error) throw error;
        if (data) setSlots(slots.map(s => s.id === editingSlot.id ? data : s));
      } else {
        const { data, error } = await supabase.from('booking_slots').insert({
          merchant_id: currentMerchantId,
          date: newSlot.date,
          time: newSlot.time,
          duration_minutes: newSlot.duration_minutes,
          capacity: newSlot.capacity,
          booked_count: 0
        }).select().single();

        if (error) throw error;
        if (data) setSlots([...slots, data]);
      }

      setNewSlot({ date: '', time: '', capacity: 1, duration_minutes: 60 });
      setEditingSlot(null);
      setShowSlotForm(false);
    } catch (error: any) {
      console.error('Error saving slot:', error);
      alert(`Failed to save slot: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditSlot = (slot: BookingSlot) => {
    setEditingSlot(slot);
    setNewSlot({
      date: slot.date,
      time: slot.time,
      capacity: slot.capacity,
      duration_minutes: slot.duration_minutes || 60
    });
    setShowSlotForm(true);
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await supabase.from('booking_slots').delete().eq('id', id);
      setSlots(slots.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  // FAQ Handlers
  const handleSaveFaq = async () => {
    // 1. Re-validate Merchant ID from latest state
    const currentSession = useStore.getState().session;
    const currentMerchantId = currentSession?.merchant?.id;

    if (!currentMerchantId) {
      alert("Session invalid or expired. Attempting to refresh...");
      await useStore.getState().validateSession();
      return;
    }

    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      alert("Question and Answer are required.");
      return;
    }

    try {
      if (editingFaq) {
        const { data, error } = await supabase.from('faqs').update({
          category: faqForm.category,
          question: faqForm.question,
          answer: faqForm.answer
        }).eq('id', editingFaq.id).select().single();

        if (error) throw error;
        if (data) setFaqs(faqs.map(f => f.id === editingFaq.id ? data : f));
      } else {
        const { data, error } = await supabase.from('faqs').insert({
          merchant_id: currentMerchantId,
          category: faqForm.category,
          question: faqForm.question,
          answer: faqForm.answer
        }).select().single();

        if (error) throw error;
        if (data) setFaqs([...faqs, data]);
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ category: 'policies', question: '', answer: '' });
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      alert(`Failed to save FAQ: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({ category: faq.category, question: faq.question, answer: faq.answer });
    setShowFaqModal(true);
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await supabase.from('faqs').delete().eq('id', id);
      setFaqs(faqs.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Training Data</h2>
          <p className="text-sm text-gray-500">Add products, slots, and FAQs to train your AI.</p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-gray-600">
          <span>{products.length} Products</span>
          <span>{slots.length} Slots</span>
          <span>{faqs.length} FAQs</span>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Products & Services</h3>
          <Button size="sm" variant="outline" onClick={() => setShowProductForm(!showProductForm)}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-gray-400" /> {product.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{product.description}</td>
                  <td className="px-4 py-3 font-medium">${product.price}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button onClick={() => handleEditProduct(product)} className="text-gray-400 hover:text-blue-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No products added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {showProductForm && (
            <div className="p-4 bg-gray-50 border-t flex gap-4 items-end">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-medium text-gray-500">Name</label>
                <input 
                  type="text" 
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="e.g. Massage"
                />
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <input 
                  type="text" 
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Brief description"
                />
              </div>
              <div className="space-y-1 w-24">
                <label className="text-xs font-medium text-gray-500">Price ($)</label>
                <input 
                  type="number" 
                  min="0"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                />
              </div>
              <Button size="sm" onClick={handleSaveProduct}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Slots Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Booking Slots</h3>
          <Button size="sm" variant="outline" onClick={() => setShowSlotForm(!showSlotForm)}>
            <Plus className="h-4 w-4 mr-2" /> Add Slot
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Slot Left</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slots.map(slot => (
                <tr key={slot.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" /> {slot.date}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" /> {slot.time}
                    </div>
                  </td>
                  <td className="px-4 py-3">{slot.duration_minutes || 60} min</td>
                  <td className="px-4 py-3">{slot.capacity}</td>
                  <td className="px-4 py-3">{Math.max(0, (slot.capacity || 0) - (slot.booked_count || 0))}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteSlot(slot.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {slots.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No slots configured. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {showSlotForm && (
            <div className="p-4 bg-gray-50 border-t flex gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Date</label>
                <input 
                  type="date" 
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newSlot.date}
                  onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Time</label>
                <input 
                  type="time" 
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newSlot.time}
                  onChange={e => setNewSlot({...newSlot, time: e.target.value})}
                />
              </div>
              <div className="space-y-1 w-24">
                <label className="text-xs font-medium text-gray-500">Duration (min)</label>
                <input 
                  type="number" 
                  min="5"
                  step="5"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newSlot.duration_minutes}
                  onChange={e => setNewSlot({...newSlot, duration_minutes: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-1 w-24">
                <label className="text-xs font-medium text-gray-500">Capacity</label>
                <input 
                  type="number" 
                  min="1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  value={newSlot.capacity}
                  onChange={e => setNewSlot({...newSlot, capacity: parseInt(e.target.value)})}
                />
              </div>
              <Button size="sm" onClick={handleSaveSlot}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">FAQs & Policies</h3>
          <Button size="sm" variant="outline" onClick={() => {
            setEditingFaq(null);
            setFaqForm({ category: 'policies', question: '', answer: '' });
            setShowFaqModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Add FAQ
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {faqs.map(faq => (
            <div key={faq.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                    {faq.category}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900">{faq.question}</h4>
                  <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditFaq(faq)} className="text-gray-400 hover:text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteFaq(faq.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button 
          onClick={onNext} 
          disabled={slots.length === 0 || faqs.length === 0 || products.length === 0}
        >
          Next Step
        </Button>
      </div>

      <Modal
        isOpen={showFaqModal}
        onClose={() => setShowFaqModal(false)}
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={faqForm.category}
              onChange={e => setFaqForm({...faqForm, category: e.target.value})}
            >
              <option value="policies">Policies</option>
              <option value="products">Products</option>
              <option value="services">Services</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Question</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={faqForm.question}
              onChange={e => setFaqForm({...faqForm, question: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Answer</label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={faqForm.answer}
              onChange={e => setFaqForm({...faqForm, answer: e.target.value})}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveFaq}>Save FAQ</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
