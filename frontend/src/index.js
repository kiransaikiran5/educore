import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// -----------------------------------------------------------------------------
// Global Error Handlers for Better Debugging
// -----------------------------------------------------------------------------

// Catch unhandled Promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Unhandled Promise Rejection:', event.reason);
  // Optionally send to error tracking service
  event.preventDefault();
});

// Catch global script errors
window.addEventListener('error', (event) => {
  console.error('🔴 Global Error:', event.error || event.message);
  // Prevent the default "Script error." masking
  event.preventDefault();
});

// -----------------------------------------------------------------------------
// React 18 Mounting
// -----------------------------------------------------------------------------
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in public/index.html.'
  );
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  // React StrictMode helps identify potential problems
  // Temporarily disable if it causes issues with third-party libraries
  <React.StrictMode>
    <App />
  </React.StrictMode>
);