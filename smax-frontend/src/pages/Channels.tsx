import React, { useState } from 'react';
import { Card, Button } from '../components/common';
import { MessageSquare, Facebook, Instagram, Phone, Copy, CheckCircle, ExternalLink, Send, MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';

export const Channels: React.FC = () => {
  const session = useStore((state) => state.session);
  const merchantId = session?.merchant.id || '2614259a-a509-4be6-83ea-b63dc59b6cad';
  const widgetUrl = window.location.origin + '/dist-widget/widget.js';

  // Mock state for connected channels
  const [connectedChannels, setConnectedChannels] = useState<Record<string, boolean>>({
    website: true,
    facebook: false,
    zalo: false,
    telegram: false
  });

  const [connecting, setConnecting] = useState<string | null>(null);

  const handleTestWidget = () => {
    window.open(`/test-widget.html?merchant_id=${merchantId}`, '_blank');
  };

  const toggleConnection = (channelId: string) => {
    if (connectedChannels[channelId]) {
      // Disconnect
      if (confirm('Are you sure you want to disconnect this channel?')) {
        setConnectedChannels(prev => ({ ...prev, [channelId]: false }));
      }
    } else {
      // Connect (Mock flow)
      setConnecting(channelId);
      setTimeout(() => {
        setConnectedChannels(prev => ({ ...prev, [channelId]: true }));
        setConnecting(null);
      }, 1500);
    }
  };

  const channels = [
    {
      id: 'website',
      name: 'Website Chat',
      icon: MessageSquare,
      description: 'Embed the AI chat widget on your website.',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      icon: Facebook,
      description: 'Connect your Facebook Page to automate replies.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      id: 'zalo',
      name: 'Zalo OA',
      icon: MessageCircle,
      description: 'Connect your Zalo Official Account.',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      icon: Send,
      description: 'Connect your Telegram Bot.',
      color: 'text-sky-500',
      bg: 'bg-sky-50',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
        <p className="text-gray-500 mt-2">Manage where your AI assistant interacts with customers.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {channels.map((channel) => {
          const isConnected = connectedChannels[channel.id];
          const isConnecting = connecting === channel.id;

          return (
            <Card key={channel.id} className={`overflow-hidden transition-all duration-300 ${isConnected ? 'ring-2 ring-blue-500/20' : ''}`}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl ${channel.bg}`}>
                      <channel.icon className={`h-8 w-8 ${channel.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {channel.name}
                        {isConnected ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Connected
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-500 mt-1">{channel.description}</p>
                    </div>
                  </div>
                  
                  {channel.id !== 'website' && (
                    <Button 
                      onClick={() => toggleConnection(channel.id)}
                      variant={isConnected ? "outline" : "primary"}
                      className={isConnected ? "text-error-600 hover:text-error-700 hover:bg-error-50 border-error-200" : ""}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect' : 'Connect')}
                    </Button>
                  )}
                </div>

                {/* Website Specific Content */}
                {channel.id === 'website' && isConnected && (
                  <div className="mt-6 border-t pt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Embed Script
                          </label>
                          <div className="relative">
                            <code className="block w-full bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                              {`<script src="${window.location.origin}/dist-widget/widget.js" data-id="${merchantId}"></script>`}
                            </code>
                            <button 
                              className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                              title="Copy to clipboard"
                              onClick={() => navigator.clipboard.writeText(`<script src="${window.location.origin}/dist-widget/widget.js" data-id="${merchantId}"></script>`)}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Paste this code before the closing <code>&lt;/body&gt;</code> tag on your website.
                          </p>
                          <div className="mt-4">
                            <Button onClick={handleTestWidget} variant="outline" className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Test Live Widget
                            </Button>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-green-900">Widget is Live</h4>
                            <p className="text-sm text-green-700 mt-1">
                              The widget is successfully installed and ready to handle conversations.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            Preview
                          </label>
                          <Button variant="outline" size="sm" onClick={handleTestWidget}>
                            Test Live Widget <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                        <div className="relative aspect-video bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                          
                          {/* Fake Website Content */}
                          <div className="absolute inset-0 p-8 opacity-20 pointer-events-none">
                            <div className="h-8 w-32 bg-gray-300 rounded mb-8" />
                            <div className="space-y-4">
                              <div className="h-4 w-full bg-gray-300 rounded" />
                              <div className="h-4 w-3/4 bg-gray-300 rounded" />
                              <div className="h-4 w-5/6 bg-gray-300 rounded" />
                            </div>
                          </div>

                          {/* Widget Preview */}
                          <div className="absolute bottom-4 right-4 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                             {/* We simulate the widget button here */}
                             <div className="h-12 w-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center">
                                <MessageSquare className="h-6 w-6 text-white" />
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Global Widget for Preview */}
    </div>
  );
};
