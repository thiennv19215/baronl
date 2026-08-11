import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

interface StageRuntimeBoundaryState {
  error?: Error;
}

function isWebGLError(error: Error): boolean {
  return /webgl|webglrenderer|gl context/i.test(`${error.name} ${error.message}`);
}

function hasWebGLContext(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

async function enableWebGLFallback(): Promise<void> {
  const url = new URL(window.location.href);
  url.searchParams.set('quality', 'low');
  url.searchParams.set('webglFallback', '1');
  window.history.replaceState(null, '', url.toString());
  try {
    await window.orbitStage?.invoke?.('config:patch', { stage: { effectQuality: 'low' } });
  } catch {
    // Browser/OBS previews may not expose the Electron bridge. The query
    // override still keeps this Stage instance in low-quality mode.
  }
}

class StageRuntimeBoundary extends Component<{ children: ReactNode }, StageRuntimeBoundaryState> {
  state: StageRuntimeBoundaryState = {};

  static getDerivedStateFromError(error: Error): StageRuntimeBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[OrbitStage] Stage renderer failed.', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="stage-viewport quality-low" data-stage-recovery="failed">
      <div className="stage-runtime-error" role="alert">
        <strong>Stage renderer unavailable</strong>
        <small>{this.state.error.message}</small>
      </div>
    </main>;
  }
}

async function bootstrap(): Promise<void> {
  if (!hasWebGLContext()) await enableWebGLFallback();
  const { default: App } = await import('./App');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <StageRuntimeBoundary><App/></StageRuntimeBoundary>
    </React.StrictMode>,
  );
}

void bootstrap();
