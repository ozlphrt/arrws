import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Service worker is auto-registered by vite-plugin-pwa
// The plugin handles registration automatically with registerType: 'autoUpdate'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


