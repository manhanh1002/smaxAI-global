import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, FileText, HelpCircle, Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CsvImportModal } from '../common/CsvImportModal';
import { FAQ, PolicyDoc } from '../../types';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export const StepScopeProcess: React.FC = () => {
  const session = useStore((s) => s.session);
  const merchantId = session?.merchant?.id;

  const [activeTab, setActiveTab] = useState<'faq' | 'policy'>('faq');

  // FAQ State
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({ category: 'policies', question: '', answer: '' });

  // Policy State
  const [policies, setPolicies] = useState<PolicyDoc[]>([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDoc | null>(null);
  const [policyForm, setPolicyForm] = useState({ title: '', content: '' });

  const [loading, setLoading] = useState(true);

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    loadData();
  }, [merchantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqRes, policyRes] = await Promise.all([
        supabase.from('faqs').select('*').eq('merchant_id', merchantId),
        supabase.from('merchant_policies').select('*').eq('merchant_id', merchantId)
      ]);

      if (faqRes.error) throw faqRes.error;
      if (policyRes.error) throw policyRes.error;

      setFaqs(faqRes.data || []);
      setPolicies(policyRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  // --- FAQ Handlers ---
  const handleSaveFaq = async () => {
    if (!merchantId || !faqForm.question.trim() || !faqForm.answer.trim()) return;
    try {
      if (editingFaq) {
        const { data, error } = await supabase.from('faqs').update({
          category: faqForm.category,
          question: faqForm.question,
          answer: faqForm.answer
        }).eq('id', editingFaq.id).select().single();
        if (error) throw error;
        setFaqs(faqs.map(f => f.id === editingFaq.id ? data : f));
      } else {
        const { data, error } = await supabase.from('faqs').insert({
          merchant_id: merchantId,
          category: faqForm.category,
          question: faqForm.question,
          answer: faqForm.answer
        }).select().single();
        if (error) throw error;
        setFaqs([...faqs, data]);
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ category: 'policies', question: '', answer: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await supabase.from('faqs').delete().eq('id', id);
      setFaqs(faqs.filter(f => f.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // --- Policy Handlers ---
  const handleSavePolicy = async () => {
    if (!merchantId || !policyForm.title.trim() || !policyForm.content.trim()) return;
    try {
      if (editingPolicy) {
        const { data, error } = await supabase.from('merchant_policies').update({
          title: policyForm.title,
          content: policyForm.content,
          updated_at: new Date().toISOString()
        }).eq('id', editingPolicy.id).select().single();
        if (error) throw error;
        setPolicies(policies.map(p => p.id === editingPolicy.id ? data : p));
      } else {
        const { data, error } = await supabase.from('merchant_policies').insert({
          merchant_id: merchantId,
          title: policyForm.title,
          content: policyForm.content
        }).select().single();
        if (error) throw error;
        setPolicies([...policies, data]);
      }
      setShowPolicyModal(false);
      setEditingPolicy(null);
      setPolicyForm({ title: '', content: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await supabase.from('merchant_policies').delete().eq('id', id);
      setPolicies(policies.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // --- CSV Import Logic ---
  const handleFaqImport = async (data: any[]) => {
    if (!merchantId) return;

    const promises = data.map(async (row) => {
      if (!row.question || !row.answer) return;

      await supabase.from('faqs').insert({
        merchant_id: merchantId,
        category: row.category || 'general',
        question: row.question,
        answer: row.answer
      });
    });

    await Promise.all(promises);
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Business Policies & FAQs</h3>
      </div>

      {/* Sub-tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'faq' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          FAQ
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'policy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4 mr-2" />
          Policy Docs
        </button>
      </div>

      {/* FAQ Section */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" /> Import FAQs
            </Button>
            <Button size="sm" onClick={() => {
              setEditingFaq(null);
              setFaqForm({ category: 'policies', question: '', answer: '' });
              setShowFaqModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" /> Add FAQ
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {faqs.map(faq => (
              <div key={faq.id} className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      {faq.category}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">{faq.question}</h4>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingFaq(faq);
                      setFaqForm({ category: faq.category, question: faq.question, answer: faq.answer });
                      setShowFaqModal(true);
                    }} className="text-gray-400 hover:text-blue-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteFaq(faq.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="text-center text-gray-500 py-8 border rounded-lg bg-white">No FAQs yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Policy Section */}
      {activeTab === 'policy' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => {
              setEditingPolicy(null);
              setPolicyForm({ title: '', content: '' });
              setShowPolicyModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" /> Add Policy
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {policies.map(policy => (
              <div key={policy.id} className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{policy.title}</h4>
                    <div 
                      className="text-sm text-gray-600 prose prose-sm max-w-none bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: policy.content }}
                    />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => {
                      setEditingPolicy(policy);
                      setPolicyForm({ title: policy.title, content: policy.content });
                      setShowPolicyModal(true);
                    }} className="text-gray-400 hover:text-blue-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeletePolicy(policy.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {policies.length === 0 && (
              <div className="text-center text-gray-500 py-8 border rounded-lg bg-white">No policies yet.</div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      <Modal
        isOpen={showFaqModal}
        onClose={() => setShowFaqModal(false)}
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <select
              className="block w-full rounded-md border px-3 py-2"
              value={faqForm.category}
              onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
            >
              <option value="policies">policies</option>
              <option value="products">products</option>
              <option value="services">services</option>
              <option value="general">general</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Question</label>
            <input className="block w-full rounded-md border px-3 py-2" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Answer</label>
            <textarea className="block w-full rounded-md border px-3 py-2" rows={4} value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveFaq}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Policy Modal */}
      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title={editingPolicy ? 'Edit Policy' : 'Add New Policy'}
      >
        <div className="space-y-4 h-[500px] flex flex-col">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Policy Title</label>
            <input 
              className="block w-full rounded-md border px-3 py-2" 
              value={policyForm.title} 
              onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
              placeholder="e.g. Return Policy"
            />
          </div>
          <div className="space-y-1 flex-1 flex flex-col">
            <label className="text-xs font-medium text-gray-500">Content</label>
            <div className="flex-1 overflow-hidden">
                <ReactQuill 
                    theme="snow" 
                    value={policyForm.content} 
                    onChange={(content) => setPolicyForm({ ...policyForm, content })}
                    className="h-[300px]"
                />
            </div>
          </div>
          <div className="flex justify-end pt-10">
            <Button onClick={handleSavePolicy}>Save Policy</Button>
          </div>
        </div>
      </Modal>

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import FAQs"
        templateData={[
          { category: 'general', question: 'What are your hours?', answer: 'We are open 9-5 daily.' },
          { category: 'policies', question: 'Do you accept returns?', answer: 'Yes, within 30 days.' }
        ]}
        templateFilename="faqs_template.csv"
        requiredFields={['question', 'answer']}
        onImport={handleFaqImport}
      />
    </div>
  );
}
