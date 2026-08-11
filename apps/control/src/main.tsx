import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameHubRoot } from './features/games';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameHubRoot />
  </React.StrictMode>,
);
