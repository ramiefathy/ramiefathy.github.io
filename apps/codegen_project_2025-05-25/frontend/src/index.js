import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assuming you have a global stylesheet
import App from './App'; // The main App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);