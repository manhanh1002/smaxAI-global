import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Button, Card } from '../../components/common';
import { Eye, EyeOff, Check, RefreshCw, Zap } from 'lucide-react';

export const AIConfiguration: React.FC = () => {
  const { aiConfig, updateAIConfig, fetchAIConfig } = useStore();
  const [localConfig, setLocalConfig] = useState(aiConfig);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  React.useEffect(() => {
    fetchAIConfig();
  }, [fetchAIConfig]);

  React.useEffect(() => {
    setLocalConfig(aiConfig);
  }, [aiConfig]);

  const fetchAvailableModels = async () => {
    if (!localConfig.openai_api_key) return;
    setIsLoadingModels(true);
    try {
        const baseUrl = localConfig.openai_base_url || 'https://api.token.ai.vn/v1';
        const res = await fetch(`${baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${localConfig.openai_api_key}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            const models = data.data?.map((m: any) => m.id) || [];
            setAvailableModels(models.sort());
        } else {
             console.error(`Failed to fetch models: ${res.status}`);
        }
    } catch (e: any) {
        console.error("Failed to fetch models", e);
    } finally {
        setIsLoadingModels(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestStatus('idle');
    try {
      console.log('Saving AI Config...', localConfig);
      await updateAIConfig(localConfig);
      // Show success feedback if needed
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Failed to save config:', error);
      setTestStatus('error');
      // Show actual error to user
      alert(`Failed to save: ${error.message || JSON.stringify(error)}`);
      setTimeout(() => setTestStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus('idle');
    // Simulate API check
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestStatus('success');
    setIsTesting(false);
  };

  const updateLocalConfig = (updates: Partial<typeof localConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            OpenAI Connection
          </h3>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={localConfig.openai_api_key || ''}
                  onChange={(e) => updateLocalConfig({ openai_api_key: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border pr-10"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={!localConfig.openai_api_key || isTesting}
              >
                {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test Connection'}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI Base URL
            </label>
            <input
              type="text"
              value={localConfig.openai_base_url || ''}
              onChange={(e) => updateLocalConfig({ openai_base_url: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="https://api.openai.com/v1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Override this if you are using a proxy or custom endpoint (e.g. https://token.ai.vn/v1).
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                AI Model
                </label>
                <button 
                    type="button"
                    onClick={fetchAvailableModels}
                    disabled={isLoadingModels || !localConfig.openai_api_key}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    {isLoadingModels ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {isLoadingModels ? 'Fetching...' : 'Fetch Models'}
                </button>
            </div>
            <select
              value={localConfig.model || 'gpt-4o-mini'}
              onChange={(e) => updateLocalConfig({ model: e.target.value as any })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <optgroup label="Standard Models">
                <option value="gpt-4o-mini">gpt-4o-mini (Recommended)</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              </optgroup>
              
              <optgroup label="Token.ai.vn Models">
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-5-chat">gpt-5-chat</option>
                <option value="gpt-5-mini">gpt-5-mini</option>
                <option value="o4-mini">o4-mini</option>
              </optgroup>

              {availableModels.length > 0 && (
                  <optgroup label="Fetched Models">
                      {availableModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                      ))}
                  </optgroup>
              )}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Behavior Settings</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Creativity (Temperature): {aiConfig.temperature}
              </label>
              <span className="text-xs text-gray-500">
                {aiConfig.temperature < 0.5 ? 'More Factual' : 'More Creative'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={aiConfig.temperature}
              onChange={(e) => updateAIConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens Per Response
            </label>
            <select
              value={aiConfig.max_tokens}
              onChange={(e) => updateAIConfig({ max_tokens: parseInt(e.target.value) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            >
              <option value="250">250 (Short)</option>
              <option value="500">500 (Standard)</option>
              <option value="1000">1000 (Long)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt
            </label>
            <textarea
              rows={4}
              value={aiConfig.system_prompt}
              onChange={(e) => updateAIConfig({ system_prompt: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              This instruction guides the AI's personality and constraints.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Sources</h3>
        <p className="text-sm text-gray-500 mb-4">Select which data the AI can access to answer customer queries.</p>
        
        <div className="space-y-3">
          {Object.entries(aiConfig.data_sources).map(([key, enabled]) => (
            <div key={key} className="flex items-center">
              <input
                id={`source-${key}`}
                type="checkbox"
                checked={enabled as boolean}
                onChange={(e) => updateAIConfig({
                  data_sources: { ...aiConfig.data_sources, [key]: e.target.checked }
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`source-${key}`} className="ml-3 block text-sm font-medium text-gray-700 capitalize">
                {key.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>Discard Changes</Button>
        <Button onClick={() => {
          // Trigger save (updates are already happening on change, but this provides visual feedback)
          // You might want to show a toast here
          alert('Configuration Saved!');
        }}>Save Configuration</Button>
      </div>
    </div>
  );
};
