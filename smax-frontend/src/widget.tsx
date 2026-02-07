import React from 'react';
import ReactDOM from 'react-dom/client';
import { EmbeddableWidget } from './components/EmbeddableWidget';
import './index.css'; // Ensure Tailwind styles are included

// Find the script tag that loaded this bundle to get config
const currentScript = document.currentScript as HTMLScriptElement;
const merchantId = currentScript?.dataset.id || '';

// Create a container for the widget
const widgetRoot = document.createElement('div');
widgetRoot.id = 'smax-widget-root';
document.body.appendChild(widgetRoot);

ReactDOM.createRoot(widgetRoot).render(
  <React.StrictMode>
    <EmbeddableWidget merchantId={merchantId} />
  </React.StrictMode>
);
