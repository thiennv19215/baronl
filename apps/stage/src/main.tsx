import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

interface StageRuntimeBoundaryState {
  error?: Error;
}

async function canCreateStageRenderer(): Promise<boolean> {
  try {
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.dispose();
    renderer.domElement.remove();
    return true;
  } catch (error) {
    console.warn('[OrbitStage] WebGL probe failed; using low-quality Stage fallback.', error);
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
    console.error('[OrbitStage] Stage renderer failed after bootstrap.', error, info.componentStack);
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
  if (!(await canCreateStageRenderer())) await enableWebGLFallback();
  const { default: App } = await import('./App');
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <StageRuntimeBoundary><App/></StageRuntimeBoundary>
    </React.StrictMode>,
  );
}

void bootstrap();
