import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameHubRoot } from './features/games';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <App />
      <GameHubRoot />
    </>
  </React.StrictMode>,
);
