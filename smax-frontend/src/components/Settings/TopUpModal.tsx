import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../lib/store';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricePer1k: number;
  onSuccess: () => void;
}

const PACKAGES = [
  { credits: 1000, label: 'Starter' },
  { credits: 5000, label: 'Growth' },
  { credits: 10000, label: 'Scale' },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, pricePer1k, onSuccess }) => {
  const session = useStore((state) => state.session);
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  
  // Form states (fake)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const calculatePrice = (credits: number) => {
    return (credits / 1000) * pricePer1k;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error: rpcError } = await supabase.rpc('top_up_credits', {
        p_merchant_id: session?.merchant?.id,
        p_amount_credits: selectedPackage.credits
      });

      if (rpcError) throw rpcError;

      onSuccess();
      onClose();
      // Reset state
      setStep('select');
      setCardNumber('');
      setExpiry('');
      setCvc('');
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.credits}
            onClick={() => setSelectedPackage(pkg)}
            className={`
              cursor-pointer p-4 rounded-lg border-2 transition-all
              ${selectedPackage.credits === pkg.credits
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-200'}
            `}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">{pkg.label}</h3>
                <p className="text-sm text-gray-500">{pkg.credits.toLocaleString()} Credits</p>
              </div>
              <div className="text-xl font-bold text-gray-900">
                ${calculatePrice(pkg.credits)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button 
        className="w-full mt-4" 
        onClick={() => setStep('payment')}
      >
        Continue to Payment
      </Button>
    </div>
  );

  const renderPaymentStep = () => (
    <form onSubmit={handlePayment} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Selected Package:</span>
          <span className="font-medium">{selectedPackage.label} ({selectedPackage.credits.toLocaleString()} Credits)</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>${calculatePrice(selectedPackage.credits)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number (Fake)</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="0000 0000 0000 0000"
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
            <input
              type="text"
              placeholder="123"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1" 
          onClick={() => setStep('select')}
          disabled={loading}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'select' ? 'Select Credit Package' : 'Payment Details'}
      className="max-w-md"
    >
      {step === 'select' ? renderSelectStep() : renderPaymentStep()}
    </Modal>
  );
};
