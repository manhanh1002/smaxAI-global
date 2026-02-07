import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Check, Trash2, Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { BookingSlot } from '../../types';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { CsvImportModal } from '../common/CsvImportModal';

export const StepBookingSlots: React.FC = () => {
  const session = useStore((s) => s.session);
  const merchantId = session?.merchant?.id;

  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<BookingSlot | null>(null);
  const [newSlot, setNewSlot] = useState({ date: '', time: '', capacity: 1, duration_minutes: 60 });

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    loadSlots();
  }, [merchantId]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_slots')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('date', { ascending: true });
      if (error) throw error;
      setSlots(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    const currentSession = useStore.getState().session;
    const currentMerchantId = currentSession?.merchant?.id;
    if (!currentMerchantId) return;
    if (!newSlot.date || !newSlot.time) return;
    try {
      if (editingSlot) {
        const { data, error } = await supabase
          .from('booking_slots')
          .update({
            date: newSlot.date,
            time: newSlot.time,
            capacity: newSlot.capacity,
            duration_minutes: newSlot.duration_minutes
          })
          .eq('id', editingSlot.id)
          .select()
          .single();
        if (error) throw error;
        if (data) setSlots(slots.map(s => s.id === editingSlot.id ? data : s));
      } else {
        const { data, error } = await supabase
          .from('booking_slots')
          .insert({
            merchant_id: currentMerchantId,
            date: newSlot.date,
            time: newSlot.time,
            duration_minutes: newSlot.duration_minutes,
            capacity: newSlot.capacity,
            booked_count: 0
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setSlots([...slots, data]);
      }
      setNewSlot({ date: '', time: '', capacity: 1, duration_minutes: 60 });
      setEditingSlot(null);
      setShowSlotForm(false);
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    }
  };

  // --- CSV Import Logic ---

  const handleCsvImport = async (data: any[]) => {
    const currentSession = useStore.getState().session;
    const currentMerchantId = currentSession?.merchant?.id;
    if (!currentMerchantId) return;

    const promises = data.map(async (row) => {
      // Basic validation
      if (!row.date || !row.time) return;

      // Ensure formats are correct (YYYY-MM-DD and HH:MM:SS or HH:MM)
      // We'll trust user input for now but could add regex validation here.
      
      await supabase.from('booking_slots').insert({
        merchant_id: currentMerchantId,
        date: row.date,
        time: row.time,
        capacity: row.capacity ? parseInt(row.capacity) : 1,
        duration_minutes: row.duration_minutes ? parseInt(row.duration_minutes) : 60,
        booked_count: 0
      });
    });

    await Promise.all(promises);
    await loadSlots();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Booking Slots</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import Slots
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditingSlot(null); setShowSlotForm(!showSlotForm); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Slot
          </Button>
        </div>
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
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleEditSlot(slot)} className="text-gray-400 hover:text-blue-600">Edit</button>
                  <button onClick={() => handleDeleteSlot(slot.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
            {slots.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No slots configured.</td>
              </tr>
            )}
          </tbody>
        </table>
        {showSlotForm && (
          <div className="p-4 bg-gray-50 border-t flex gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Date</label>
              <input type="date" className="block w-full rounded-md border px-3 py-2" value={newSlot.date} onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Time</label>
              <input type="time" className="block w-full rounded-md border px-3 py-2" value={newSlot.time} onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })} />
            </div>
            <div className="space-y-1 w-28">
              <label className="text-xs font-medium text-gray-500">Duration (min)</label>
              <input type="number" min={5} step={5} className="block w-full rounded-md border px-3 py-2" value={newSlot.duration_minutes} onChange={(e) => setNewSlot({ ...newSlot, duration_minutes: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-1 w-28">
              <label className="text-xs font-medium text-gray-500">Capacity</label>
              <input type="number" min={1} className="block w-full rounded-md border px-3 py-2" value={newSlot.capacity} onChange={(e) => setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) })} />
            </div>
            <Button size="sm" onClick={handleSaveSlot}><Check className="h-4 w-4" /></Button>
          </div>
        )}
      </div>

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Booking Slots"
        templateData={[
          { date: '2024-01-01', time: '09:00', capacity: 2, duration_minutes: 60 },
          { date: '2024-01-01', time: '10:00', capacity: 2, duration_minutes: 60 },
          { date: '2024-01-02', time: '09:00', capacity: 1, duration_minutes: 30 }
        ]}
        templateFilename="slots_template.csv"
        requiredFields={['date', 'time']}
        onImport={handleCsvImport}
      />
    </div>
  );
}
