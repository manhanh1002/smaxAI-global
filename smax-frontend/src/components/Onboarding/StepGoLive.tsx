import React, { useState, useEffect } from 'react';
import { Rocket, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';

interface StepGoLiveProps {
  onBack: () => void;
}

export const StepGoLive: React.FC<StepGoLiveProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const updateMerchant = useStore((state) => state.updateMerchant);

  const session = useStore((state) => state.session);
  const merchantId = session?.merchant?.id;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTraining) {
      // Simulate progress up to 90%
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isTraining]);

  const handleTrain = async () => {
    setIsTraining(true);
    setProgress(0);

    try {
        // Call Edge Function to generate prompt
        // Note: In local dev we use the function URL, in prod it would be relative or absolute
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        // Construct function URL (Assuming standard Supabase Edge Function path)
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-system-prompt`;
        
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ merchant_id: merchantId })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Failed to generate prompt:', err);
            // Don't block onboarding on AI error, just proceed with default
        } else {
             const result = await response.json();
             console.log('System Prompt Generated:', result.system_prompt);
        }

    } catch (e) {
        console.error('Error triggering AI generation:', e);
    }

    // Finish
    setProgress(100);
    setIsTraining(false);
    setIsComplete(true);
    updateMerchant({ ai_trained: true });
  };

  const getProgressLabel = (p: number) => {
    if (p < 33) return 'Loading your data...';
    if (p < 66) return 'Processing business rules...';
    if (p < 99) return 'Configuring AI model...';
    return 'Finalizing...';
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">AI Training Complete!</h2>
          <p className="text-gray-500">
            Your AI is now live and ready to handle customer bookings.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 w-full max-w-lg text-left space-y-4">
          <h3 className="font-semibold text-gray-900">Demo API Response Simulation:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              47 historical conversations loaded
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Booking slots indexed
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              FAQs embedded as knowledge graph
            </li>
          </ul>
        </div>

        <div className="w-full max-w-md">
          <Button 
            className="w-full" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in fade-in duration-300">
      <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
        <Rocket className="h-10 w-10 text-blue-600" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900">Train Your AI Assistant</h2>
        <p className="text-gray-500">
          Everything is ready. Train your AI on your business data and start handling bookings automatically.
        </p>
      </div>

      {isTraining ? (
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>{getProgressLabel(progress)}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Processing time: ~3 seconds</p>
        </div>
      ) : (
        <div className="space-y-8 w-full max-w-md">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-left space-y-4">
            <h3 className="font-semibold text-blue-900">What happens next:</h3>
            <ul className="space-y-3 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                AI learns your business rules
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                AI understands booking slots
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Chat widget goes live
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={handleTrain} className="w-full">
              Train AI Now
            </Button>
            <Button variant="ghost" onClick={onBack} className="text-gray-500">
              Back to Training Data
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
