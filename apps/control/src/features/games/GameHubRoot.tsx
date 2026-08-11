import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [host, setHost] = useState<HTMLElement>();
  const [active, setActive] = useState(false);

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

  useEffect(() => {
    const content = document.querySelector<HTMLElement>('.main-shell .content');
    const nav = document.querySelector<HTMLElement>('.sidebar nav');
    if (!content || !nav) return;

    setHost(content);
    const sync = () => {
      const gameActive = Boolean(nav.querySelector('.nav-item:nth-of-type(3).active'));
      setActive(gameActive);
      content.classList.toggle('game-hub-host-active', gameActive);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      content.classList.remove('game-hub-host-active');
    };
  }, []);

  const patch = useCallback(async <K extends keyof AppConfig,>(
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

  if (!host || !active) return null;

  return createPortal(
    <section className="game-hub-inline" aria-label="Kho game LIVE">
      {loading
        ? <div className="game-hub-loading"><span/><strong>Đang mở kho game…</strong></div>
        : <GameHubScreen config={config} patch={patch} notify={notify}/>
      }
      {toast && <div className={`game-hub-toast ${toast.tone}`}>{toast.message}</div>}
    </section>,
    host,
  );
}
