import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

interface StageRuntimeBoundaryState {
  error?: Error;
}

function isWebGLError(error: Error): boolean {
  return /webgl|webglrenderer|gl context/i.test(`${error.name} ${error.message}`);
}

class StageRuntimeBoundary extends Component<{ children: ReactNode }, StageRuntimeBoundaryState> {
  state: StageRuntimeBoundaryState = {};

  static getDerivedStateFromError(error: Error): StageRuntimeBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[OrbitStage] Stage renderer failed.', error, info.componentStack);
    if (!isWebGLError(error)) return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('webglFallback') === '1') return;
    url.searchParams.set('quality', 'low');
    url.searchParams.set('webglFallback', '1');
    window.location.replace(url.toString());
  }

  render() {
    if (!this.state.error) return this.props.children;
    const recoveringWebGL = isWebGLError(this.state.error) && new URLSearchParams(window.location.search).get('webglFallback') !== '1';
    return <main className="stage-viewport quality-low" data-stage-recovery={recoveringWebGL ? 'webgl-reload' : 'failed'}>
      {!recoveringWebGL && <div className="stage-runtime-error" role="alert">
        <strong>Stage renderer unavailable</strong>
        <small>{this.state.error.message}</small>
      </div>}
    </main>;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StageRuntimeBoundary><App/></StageRuntimeBoundary>
  </React.StrictMode>,
);
