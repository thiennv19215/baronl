import type { ReactNode } from 'react';

export function GamePanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card game-manager-card ${className}`}>{children}</section>;
}

export function GamePanelTitle({ title, hint }: { title: string; hint?: string }) {
  return <div className="card-title"><div><h3>{title}</h3>{hint && <p>{hint}</p>}</div></div>;
}

export function GameField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function GameToggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return <div className="toggle-row">
    <div><strong>{label}</strong>{description && <span>{description}</span>}</div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    ><span/></button>
  </div>;
}
