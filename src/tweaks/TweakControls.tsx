import { useState, useRef, type ReactNode } from 'react';
import './tweaks.css';

/* ── Layout helpers ──────────────────────────────────────────── */

export function TweakSection({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── TweakRadio ──────────────────────────────────────────────── */

interface RadioOption {
  value: string;
  label: string;
}

interface TweakRadioProps {
  label?: string;
  value: string;
  options: (string | RadioOption)[];
  onChange: (value: string) => void;
}

export function TweakRadio({ label, value, options, onChange }: TweakRadioProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const labelLen = (o: string | RadioOption) =>
    String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments =
    maxLen <= (({ 2: 16, 3: 10 } as Record<number, number>)[options.length] ?? 0);

  if (!fitsAsSegments) {
    const resolve = (s: string) => {
      const m = options.find(
        (o) => String(typeof o === 'object' ? o.value : o) === s,
      );
      if (m === undefined) return s;
      return typeof m === 'object' ? m.value : m;
    };
    return (
      <TweakSelect
        label={label}
        value={value}
        options={options}
        onChange={(s) => onChange(resolve(s))}
      />
    );
  }

  const opts = options.map((o) =>
    typeof o === 'object' ? o : { value: o, label: o },
  );
  const idx = Math.max(
    0,
    opts.findIndex((o) => o.value === value),
  );
  const n = opts.length;

  const segAt = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev: PointerEvent) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const inner = (
    <div
      ref={trackRef}
      role="radiogroup"
      onPointerDown={onPointerDown}
      className={dragging ? 'twk-seg dragging' : 'twk-seg'}
    >
      <div
        className="twk-seg-thumb"
        style={{
          left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
          width: `calc((100% - 4px) / ${n})`,
        }}
      />
      {opts.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
          {o.label}
        </button>
      ))}
    </div>
  );

  if (!label) return inner;
  return <TweakRow label={label}>{inner}</TweakRow>;
}

/* ── TweakSelect (fallback) ──────────────────────────────────── */

function TweakSelect({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: (string | RadioOption)[];
  onChange: (value: string) => void;
}) {
  const select = (
    <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
  if (!label) return select;
  return <TweakRow label={label}>{select}</TweakRow>;
}

/* ── Color helpers ───────────────────────────────────────────── */

function __twkIsLight(hex: string): boolean {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

function TwkCheck({ light }: { light: boolean }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M3 7.2 5.8 10 11 4.2"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={light ? 'rgba(0,0,0,.78)' : '#fff'}
      />
    </svg>
  );
}

/* ── TweakColor ──────────────────────────────────────────────── */

interface TweakColorProps {
  label?: string;
  value: string | string[];
  options: (string | string[])[];
  onChange: (value: string | string[]) => void;
}

export function TweakColor({ label, value, options, onChange }: TweakColorProps) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl">
          <span>{label}</span>
        </div>
        <input
          type="color"
          className="twk-swatch"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const key = (o: string | string[]) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);

  const chips = (
    <div className="twk-chips" role="radiogroup">
      {options.map((o, i) => {
        const colors = Array.isArray(o) ? o : [o];
        const [hero, ...rest] = colors;
        const sup = rest.slice(0, 4);
        const on = key(o) === cur;
        return (
          <button
            key={i}
            type="button"
            className="twk-chip"
            role="radio"
            aria-checked={on}
            data-on={on ? '1' : '0'}
            aria-label={colors.join(', ')}
            title={colors.join(' · ')}
            style={{ background: hero }}
            onClick={() => onChange(o)}
          >
            {sup.length > 0 && (
              <span>
                {sup.map((c, j) => (
                  <i key={j} style={{ background: c }} />
                ))}
              </span>
            )}
            {on && <TwkCheck light={__twkIsLight(hero)} />}
          </button>
        );
      })}
    </div>
  );

  if (!label) return chips;
  return <TweakRow label={label}>{chips}</TweakRow>;
}

/* ── TweakButton ─────────────────────────────────────────────── */

interface TweakButtonProps {
  label?: string;
  children?: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}

export function TweakButton({ label, children, onClick, secondary = false }: TweakButtonProps) {
  return (
    <button
      type="button"
      className={secondary ? 'twk-btn secondary' : 'twk-btn'}
      onClick={onClick}
    >
      {children ?? label}
    </button>
  );
}
