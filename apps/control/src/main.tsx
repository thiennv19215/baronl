import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameHubStandalone } from './GameHubStandalone';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <GameHubStandalone />
  </React.StrictMode>,
);
