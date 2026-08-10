import { useEffect, useRef, useState } from 'react';

interface Live2DHostProps {
  assetRoot: string;
  speaking: boolean;
  blink: boolean;
  fallbackSource: string;
}

type CubismFrameworkModule = {
  CubismFramework: { startUp: () => void; initialize: () => void; getIdManager: () => { getId: (name: string) => unknown } };
  CubismMoc: { create: (buffer: ArrayBuffer, checkConsistency: boolean) => any };
  CubismRenderer_WebGL: new () => any;
  CubismModelMatrix: new (width: number, height: number) => any;
};

let corePromise: Promise<void> | undefined;

function loadCubismCore(url: string): Promise<void> {
  if ((globalThis as typeof globalThis & { Live2DCubismCore?: unknown }).Live2DCubismCore) return Promise.resolve();
  if (corePromise) return corePromise;
  corePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Không tải được Cubism Core')), { once: true });
    document.head.append(script);
  });
  return corePromise;
}

async function createTexture(gl: WebGLRenderingContext, url: string): Promise<WebGLTexture> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Không tải được texture Live2D: ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob(), { premultiplyAlpha: 'premultiply' });
  const texture = gl.createTexture();
  if (!texture) throw new Error('Không tạo được texture WebGL');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
  gl.generateMipmap(gl.TEXTURE_2D);
  bitmap.close();
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

export function Live2DHost({ assetRoot, speaking, blink, fallbackSource }: Live2DHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(speaking);
  const blinkRef = useRef(blink);
  const [failed, setFailed] = useState(false);
  speakingRef.current = speaking;
  blinkRef.current = blink;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let destroyRuntime: (() => void) | undefined;
    const canvas = document.createElement('canvas');
    canvas.className = 'live2d-canvas';
    container.append(canvas);

    void (async () => {
      try {
        const vendorRoot = `${assetRoot}/vendor/live2d`;
        await loadCubismCore(`${vendorRoot}/Core/live2dcubismcore.min.js`);
        const framework = await import(/* @vite-ignore */ `${vendorRoot}/Framework/browser/framework-browser-entry.js`) as CubismFrameworkModule;
        framework.CubismFramework.startUp();
        framework.CubismFramework.initialize();
        const gl = (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true }) ?? canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: true })) as WebGLRenderingContext | null;
        if (!gl) throw new Error('WebGL không khả dụng cho Live2D');
        const modelUrl = `${assetRoot}/live2d/luna/Luna-Live2D-Cubism.model3.json`;
        const manifest = await fetch(modelUrl).then((response) => {
          if (!response.ok) throw new Error(`Không tải được model Live2D: ${response.status}`);
          return response.json() as Promise<{ FileReferences: { Moc: string; Textures: string[] } }>;
        });
        const base = new URL(modelUrl, location.href);
        const mocUrl = new URL(manifest.FileReferences.Moc, base).href;
        const mocBuffer = await fetch(mocUrl).then((response) => response.arrayBuffer());
        const moc = framework.CubismMoc.create(mocBuffer, true);
        const model = moc?.createModel();
        if (!model) throw new Error('Model moc3 không tương thích');
        const renderer = new framework.CubismRenderer_WebGL();
        renderer.initialize(model);
        renderer.startUp(gl);
        renderer.setIsPremultipliedAlpha(true);
        const textures = await Promise.all(manifest.FileReferences.Textures.map((path) => createTexture(gl, new URL(path, base).href)));
        textures.forEach((texture, index) => renderer.bindTexture(index, texture));
        const matrix = new framework.CubismModelMatrix(model.getCanvasWidth(), model.getCanvasHeight());
        matrix.setHeight(1.55);
        matrix.setCenterPosition(.12, .52);
        renderer.setMvpMatrix(matrix);
        const ids = framework.CubismFramework.getIdManager();
        const parameters = {
          eyeL: model.getParameterIndex(ids.getId('ParamEyeLOpen')),
          eyeR: model.getParameterIndex(ids.getId('ParamEyeROpen')),
          mouth: model.getParameterIndex(ids.getId('ParamMouthOpenY')),
          breath: model.getParameterIndex(ids.getId('ParamBreath')),
          body: model.getParameterIndex(ids.getId('ParamBodyAngleX')),
        };
        const resize = () => {
          const ratio = Math.min(2, Math.max(1, devicePixelRatio || 1));
          canvas.width = Math.max(1, Math.round(container.clientWidth * ratio));
          canvas.height = Math.max(1, Math.round(container.clientHeight * ratio));
          gl.viewport(0, 0, canvas.width, canvas.height);
        };
        observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();
        const started = performance.now();
        const draw = (now: number) => {
          if (disposed) return;
          const elapsed = now - started;
          const blinkPhase = elapsed % 4_300;
          const eyes = blinkRef.current && blinkPhase < 170 ? Math.abs(blinkPhase / 85 - 1) : 1;
          const mouth = speakingRef.current ? .2 + Math.abs(Math.sin(elapsed / 68)) * .75 : 0;
          const set = (index: number, value: number) => { if (index >= 0) model.setParameterValueByIndex(index, value); };
          set(parameters.eyeL, eyes); set(parameters.eyeR, eyes); set(parameters.mouth, mouth);
          set(parameters.breath, .5 + Math.sin(elapsed / 760) * .2); set(parameters.body, Math.sin(elapsed / 1_100) * .7);
          gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          model.update();
          renderer.drawModel(`${vendorRoot}/Framework/Shaders/WebGL/`);
          frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        destroyRuntime = () => {
          renderer.release();
          textures.forEach((texture) => gl.deleteTexture(texture));
          moc.deleteModel(model);
          moc.release();
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      destroyRuntime?.();
      canvas.remove();
    };
  }, [assetRoot]);

  return <div ref={containerRef} className={`live2d-host ${failed ? 'failed' : ''}`}>{failed && <img className="host-art base-art" src={fallbackSource} alt=""/>}</div>;
}
