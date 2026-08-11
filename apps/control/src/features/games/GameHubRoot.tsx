import { useCallback, useEffect, useState } from 'react';
import { bridge } from '../../bridge';
import { defaultConfig, mergeConfig } from '../../lib/model';
import type { AppConfig, ConfigPatch } from '../../types';
import { GameHubScreen } from './GameHubScreen';
import type { Notify, PatchConfig } from './types';
import './styles/game-hub-overlay.css';

export function GameHubRoot() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'warn' | 'error' }>();

  const notify: Notify = useCallback((message, tone = 'ok') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(undefined), 2800);
  }, []);

  const load = useCallback(async () => {
    try {
      setConfig(mergeConfig(defaultConfig, await bridge.config()));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể đọc cấu hình game.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
    const dispose = bridge.subscribe((event) => {
      if (event.type === 'config' && event.payload) {
        setConfig((current) => mergeConfig(current, event.payload as ConfigPatch));
      }
    });
    return dispose;
  }, [load]);

  const patch = useCallback(async <K extends keyof AppConfig>(
    section: K,
    value: Partial<AppConfig[K]>,
    success?: string,
  ) => {
    const next = { [section]: value } as ConfigPatch;
    setConfig((current) => mergeConfig(current, next));
    try {
      await bridge.saveConfig(next);
      if (success) notify(success);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể lưu cấu hình game.', 'error');
      void load();
    }
  }, [load, notify]) as PatchConfig;

  return <section className="game-hub-overlay" aria-label="Kho game LIVE">
    {loading
      ? <div className="game-hub-loading"><span/><strong>Đang mở kho game…</strong></div>
      : <GameHubScreen config={config} patch={patch} notify={notify}/>
    }
    {toast && <div className={`game-hub-toast ${toast.tone}`}>{toast.message}</div>}
  </section>;
}
