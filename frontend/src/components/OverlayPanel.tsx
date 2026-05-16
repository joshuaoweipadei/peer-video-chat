import React, { useEffect, useState, useCallback } from 'react'
import type { Detection, OverlayOptions, OverlayPanelProps, OverlaySnapshot } from '../types'

// ── Confidence tier ───────────────────────────────────────────────────────────
type Tier = 'high' | 'med' | 'low'

function getTier(conf: number): Tier {
  if (conf >= 75) return 'high'
  if (conf >= 50) return 'med'
  return 'low'
}

const TIER_TEXT: Record<Tier, string> = {
  high: 'text-cv-accent',
  med:  'text-cv-amber',
  low:  'text-cv-danger',
}

const TIER_BORDER: Record<Tier, string> = {
  high: 'border-l-[#00e5a0]',
  med:  'border-l-[#ffb347]',
  low:  'border-l-[#ff4757]',
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
interface ToggleProps {
  id:       string
  label:    string
  checked:  boolean
  onChange: (value: boolean) => void
}

function Toggle({ id, label, checked, onChange }: ToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5">
      <label
        htmlFor={id}
        className="text-[11px] text-cv-text cursor-pointer select-none"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full border transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-cv-accent focus:ring-offset-1
          focus:ring-offset-cv-bg
          ${checked
          ? 'bg-cv-accent border-cv-accent'
          : 'bg-cv-card border-white/[0.07]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200
            ${checked ? 'left-[18px] bg-cv-bg' : 'left-0.5 bg-cv-muted'}`}
        />
      </button>
    </div>
  )
}

// ── Slider row ────────────────────────────────────────────────────────────────
interface SliderRowProps {
  label:        string
  value:        number
  displayValue: string
  min:          number
  max:          number
  step?:        number
  onChange:     (v: number) => void
}

function SliderRow({
                     label, value, displayValue, min, max, step = 1, onChange,
                   }: SliderRowProps): React.JSX.Element {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] text-cv-muted uppercase tracking-wider">{label}</span>
        <strong className="text-[10px] text-cv-text font-mono">{displayValue}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#00e5a0' }}
      />
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  value: number | string
  label: string
}

function StatCard({ value, label }: StatCardProps): React.JSX.Element {
  return (
    <div className="bg-cv-card rounded border border-white/[0.07] p-2.5">
      <div className="font-display text-xl font-bold text-cv-text leading-none">
        {value}
      </div>
      <div className="text-[10px] text-cv-muted uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  )
}

// ── Detection log item ────────────────────────────────────────────────────────
interface DetItemProps {
  detection: Detection
}

function DetItem({ detection: d }: DetItemProps): React.JSX.Element {
  const t = getTier(d.conf)
  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-2 bg-cv-card rounded
        border-l-2 ${TIER_BORDER[t]} animate-slide-up`}
    >
      <span className="text-[10px] text-cv-muted font-mono w-8 shrink-0">
        #{String(d.id).padStart(3, '0')}
      </span>
      <span
        className="flex-1 text-[11px] uppercase tracking-wide font-mono"
        style={{ color: d.cls.color }}
      >
        {d.cls.name}
      </span>
      <span className={`text-[11px] font-semibold font-mono ${TIER_TEXT[t]}`}>
        {Math.round(d.conf)}%
      </span>
    </div>
  )
}

// ── OverlayPanel ──────────────────────────────────────────────────────────────

/**
 * OverlayPanel
 *
 * Sidebar showing:
 *  - Session stats (active objects, FPS, avg confidence, total seen)
 *  - Feature toggles (boxes, IDs, confidence, labels, trail)
 *  - Config sliders (threshold, spawn rate, max objects)
 *  - Live scrolling detection log
 */
export default function OverlayPanel({
 overlayOptions,
 setOverlay,
 getSnapshot,
 remoteJoined,
 totalSeen,
}: OverlayPanelProps): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<OverlaySnapshot>({
    detections: [],
    fps:        0,
  })

  // Poll the hook snapshot at 4Hz — no need to match the 30fps render loop
  useEffect(() => {
    const id = setInterval(() => {
      setSnapshot(getSnapshot())
    }, 250)
    return () => clearInterval(id)
  }, [getSnapshot])

  // Type-safe partial updater
  const set = useCallback(
    <K extends keyof OverlayOptions>(key: K) =>
      (val: OverlayOptions[K]): void => {
        setOverlay((prev) => ({ ...prev, [key]: val }))
      },
    [setOverlay],
  )

  const { detections, fps } = snapshot
  const avgConf = detections.length > 0
    ? Math.round(
      detections.reduce((s, d) => s + d.conf, 0) / detections.length,
    )
    : 0

  return (
    <aside
      className="flex flex-col h-full bg-cv-surface border-l border-white/[0.07] overflow-y-auto"
      aria-label="Detection overlay controls and log"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-[10px] text-cv-muted uppercase tracking-widest">
          Overlay Panel
        </p>
        <p className="text-[11px] text-cv-text mt-0.5">
          {remoteJoined
            ? <span className="text-cv-accent">● Remote peer connected</span>
            : <span className="text-cv-muted">Waiting for peer…</span>}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-[10px] text-cv-muted uppercase tracking-wider mb-2">
          Session Stats
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard value={detections.length}                            label="Active" />
          <StatCard value={totalSeen}                                    label="Total seen" />
          <StatCard value={fps}                                          label="FPS" />
          <StatCard value={detections.length > 0 ? `${avgConf}%` : '—'} label="Avg conf" />
        </div>
      </div>

      {/* Overlay toggles */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-[10px] text-cv-muted uppercase tracking-wider mb-1">
          Overlay Options
        </p>
        <Toggle id="tog-enabled"  label="Overlay Active"   checked={overlayOptions.enabled}    onChange={set('enabled')} />
        <Toggle id="tog-boxes"    label="Bounding Boxes"   checked={overlayOptions.showBoxes}  onChange={set('showBoxes')} />
        <Toggle id="tog-ids"      label="Tracking IDs"     checked={overlayOptions.showIds}    onChange={set('showIds')} />
        <Toggle id="tog-conf"     label="Confidence Score" checked={overlayOptions.showConf}   onChange={set('showConf')} />
        <Toggle id="tog-label"    label="Class Label"      checked={overlayOptions.showLabel}  onChange={set('showLabel')} />
        <Toggle id="tog-trail"    label="Motion Trail"     checked={overlayOptions.showTrail}  onChange={set('showTrail')} />
      </div>

      {/* Sliders */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-[10px] text-cv-muted uppercase tracking-wider mb-2">
          Detection Config
        </p>
        <SliderRow
          label="Min Confidence"
          value={overlayOptions.threshold}
          displayValue={`${overlayOptions.threshold}%`}
          min={0} max={95}
          onChange={set('threshold')}
        />
        <SliderRow
          label="Spawn Rate"
          value={overlayOptions.spawnRate}
          displayValue={`${overlayOptions.spawnRate}/s`}
          min={1} max={8}
          onChange={set('spawnRate')}
        />
        <SliderRow
          label="Max Objects"
          value={overlayOptions.maxObjects}
          displayValue={`${overlayOptions.maxObjects}`}
          min={1} max={16}
          onChange={set('maxObjects')}
        />
      </div>

      {/* Detection log */}
      <div className="px-4 py-3 flex-1 min-h-0">
        <p className="text-[10px] text-cv-muted uppercase tracking-wider mb-2">
          Detection Log
        </p>
        <div
          className="flex flex-col gap-1.5"
          aria-live="polite"
          aria-label="Live detection results"
        >
          {detections.length === 0 ? (
            <p className="text-[11px] text-cv-muted">No active detections</p>
          ) : (
            detections
              .slice(0, 10)
              .map((d) => <DetItem key={d.id} detection={d} />)
          )}
        </div>
      </div>
    </aside>
  )
}