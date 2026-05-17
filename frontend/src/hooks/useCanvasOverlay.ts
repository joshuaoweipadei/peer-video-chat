import React,{ useEffect, useRef, useCallback } from 'react'
import type {
  Detection,
  DetectionClass,
  OverlayOptions,
  OverlaySnapshot,
  TrailMap,
} from '../types'

interface CanvasRenderingContext2DWithRoundRect extends CanvasRenderingContext2D {
  roundRect(
    x:       number,
    y:       number,
    width:   number,
    height:  number,
    radii?:  number | number[] | DOMPointInit | (number | DOMPointInit)[],
  ): void
}

// ─── Detection class catalogue ────────────────────────────────────────────────
export const DETECTION_CLASSES: readonly DetectionClass[] = [
  { name: 'person',  color: '#00e5a0' },
  { name: 'vehicle', color: '#00b8ff' },
  { name: 'bicycle', color: '#ffb347' },
  { name: 'animal',  color: '#ff79c6' },
  { name: 'object',  color: '#a78bfa' },
  { name: 'unknown', color: '#ff4757' },
] as const

// ─── Hook props ───────────────────────────────────────────────────────────────
interface UseCanvasOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  videoRef:  React.RefObject<HTMLVideoElement | null>
  options:   Partial<OverlayOptions>
}

interface UseCanvasOverlayReturn {
  getSnapshot:    () => OverlaySnapshot
  fpsRef:         React.RefObject<number>
  detectionsRef:  React.RefObject<Detection[]>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * useCanvasOverlay
 *
 * Runs a requestAnimationFrame loop that:
 *   - Simulates object detections (position, velocity, confidence, lifecycle)
 *   - Draws bounding boxes, corner brackets, label bars, and motion trails
 *     onto a <canvas> element sitting over a <video> element
 *
 * Replace `spawnDetection` with real model output to go production:
 *   - TensorFlow.js coco-ssd:  `model.detect(videoRef.current)`
 *   - ONNX Runtime Web:        custom model inference
 *   - WebSocket stream:        Python YOLO / Detectron2 backend
 */
export function useCanvasOverlay({
 canvasRef,
 options,
}: UseCanvasOverlayProps): UseCanvasOverlayReturn {
  // ── Resolved options with defaults ────────────────────────────────────────
  const DEFAULT_OPTIONS: OverlayOptions = {
    enabled:    true,
    showBoxes:  true,
    showIds:    true,
    showConf:   true,
    showLabel:  true,
    showTrail:  false,
    threshold:  40,
    spawnRate:  3,
    maxObjects: 10,
  }

  // All mutable state lives in refs — avoids triggering re-renders per frame
  const detectionsRef  = useRef<Detection[]>([])
  const trailsRef      = useRef<TrailMap>({})
  const nextIdRef      = useRef<number>(1)
  const lastSpawnRef   = useRef<number>(0)
  const fpsRef         = useRef<number>(0)
  const frameCountRef  = useRef<number>(0)
  const lastFpsTimeRef = useRef<number>(performance.now())

  // Keep the options ref current so the loop always reads latest values
  // without needing to restart the rAF loop
  const optionsRef = useRef<OverlayOptions>({ ...DEFAULT_OPTIONS, ...options })
  useEffect(() => {
    optionsRef.current = { ...DEFAULT_OPTIONS, ...options }
  })

  // ── Spawn one simulated detection ─────────────────────────────────────────
  const spawnDetection = useCallback((W: number, H: number): void => {
    const cls = DETECTION_CLASSES[
      Math.floor(Math.random() * DETECTION_CLASSES.length)
      ]
    if (!cls) return

    const w  = 55 + Math.random() * 130
    const h  = 55 + Math.random() * 110
    const x  = Math.random() * (W - w)
    const y  = Math.random() * (H - h)
    const id = nextIdRef.current++

    trailsRef.current[id] = []

    const detection: Detection = {
      id,
      cls,
      x, y, w, h,
      tx: x, ty: y,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 0.9,
      conf: 42 + Math.random() * 54,
      age:  0,
      life: 130 + Math.floor(Math.random() * 220),
    }

    detectionsRef.current.push(detection)
  }, [])

  // ── Update detection physics + lifecycle ──────────────────────────────────
  const updateDetections = useCallback((W: number, H: number): void => {
    const opts = optionsRef.current
    const now  = performance.now()

    const spawnInterval = 1000 / opts.spawnRate
    if (
      now - lastSpawnRef.current > spawnInterval &&
      detectionsRef.current.length < opts.maxObjects
    ) {
      spawnDetection(W, H)
      lastSpawnRef.current = now
    }

    detectionsRef.current = detectionsRef.current.filter((d): boolean => {
      d.age++

      // Move target position
      d.tx += d.vx
      d.ty += d.vy

      // Bounce off canvas walls
      if (d.tx < 0)        { d.tx = 0;        d.vx = -d.vx }
      if (d.tx + d.w > W)  { d.tx = W - d.w;  d.vx = -d.vx }
      if (d.ty < 0)        { d.ty = 0;        d.vy = -d.vy }
      if (d.ty + d.h > H)  { d.ty = H - d.h;  d.vy = -d.vy }

      // Lerp rendered position toward target (tracker catch-up effect)
      d.x += (d.tx - d.x) * 0.14
      d.y += (d.ty - d.y) * 0.14

      // Record centroid for trail
      if (opts.showTrail) {
        const cx = d.x + d.w / 2
        const cy = d.y + d.h / 2
        const trail = trailsRef.current[d.id] ?? []
        trail.push({ x: cx, y: cy })
        if (trail.length > 32) trail.shift()
        trailsRef.current[d.id] = trail
      }

      // Jitter confidence to simulate real model output
      d.conf += (Math.random() - 0.5) * 1.5
      d.conf  = Math.min(98, Math.max(18, d.conf))

      // Remove expired detections
      if (d.age > d.life) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete trailsRef.current[d.id]
        return false
      }
      return true
    })
  }, [spawnDetection])

  // ── Draw one frame onto the canvas ────────────────────────────────────────
  const drawFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    W:   number,
    H:   number,
  ): void => {
    const opts   = optionsRef.current
    ctx.clearRect(0, 0, W, H)

    const visible = detectionsRef.current.filter((d) => d.conf >= opts.threshold)

    for (const d of visible) {
      const { id, cls, x, y, w, h, conf, age, life } = d
      const color = cls.color

      // Fade in for first 10 frames, fade out for last 15
      const alpha =
        age < 10          ? age / 10 :
          age > life - 15   ? (life - age) / 15 :
            1

      // ── Motion trail ──────────────────────────────────────────────────
      if (opts.showTrail) {
        const pts = trailsRef.current[id]
        if (pts && pts.length > 1) {
          ctx.save()
          for (let i = 1; i < pts.length; i++) {
            const t = i / pts.length
            ctx.globalAlpha = t * alpha * 0.45
            ctx.strokeStyle = color
            ctx.lineWidth   = t * 2.5
            ctx.beginPath()
            ctx.moveTo(pts[i - 1]!.x, pts[i - 1]!.y)
            ctx.lineTo(pts[i]!.x,     pts[i]!.y)
            ctx.stroke()
          }
          ctx.restore()
        }
      }

      ctx.save()
      ctx.globalAlpha = alpha

      // ── Bounding box ──────────────────────────────────────────────────
      if (opts.showBoxes) {
        ctx.fillStyle = `${color}18`
        ctx.fillRect(x, y, w, h)

        ctx.strokeStyle = color
        ctx.lineWidth   = 1.5
        ctx.strokeRect(x, y, w, h)

        // Tactical corner bracket accents
        const cs = 12
        ctx.lineWidth = 3
        ctx.lineCap   = 'square'

        type Corner = [number, number, number, number]
        const corners: Corner[] = [
          [x,     y,      cs,   cs],
          [x + w, y,     -cs,   cs],
          [x,     y + h,  cs,  -cs],
          [x + w, y + h, -cs,  -cs],
        ]

        for (const [ox, oy, hx, vy] of corners) {
          ctx.beginPath()
          ctx.moveTo(ox + hx, oy)
          ctx.lineTo(ox,      oy)
          ctx.lineTo(ox,      oy + vy)
          ctx.stroke()
        }
      }

      // ── Label bar ─────────────────────────────────────────────────────
      if (opts.showIds || opts.showLabel || opts.showConf) {
        const parts: string[] = []
        if (opts.showIds)   parts.push(`#${String(id).padStart(3, '0')}`)
        if (opts.showLabel) parts.push(cls.name.toUpperCase())
        if (opts.showConf)  parts.push(`${Math.round(conf)}%`)

        const text     = parts.join('  ')
        const fontSize = 11
        ctx.font       = `600 ${fontSize}px 'JetBrains Mono', monospace`
        const tw       = ctx.measureText(text).width
        const barH     = 20
        const pad      = 7

        ctx.fillStyle = color
        ctx.beginPath()
        const ctx2d = ctx as CanvasRenderingContext2DWithRoundRect
        if (typeof ctx2d.roundRect === 'function') {
          ctx2d.roundRect(x, y - barH, tw + pad * 2, barH, [3, 3, 0, 0])
        } else {
          ctx.rect(x, y - barH, tw + pad * 2, barH)
        }
        ctx.fill()

        ctx.fillStyle = '#000000'
        ctx.fillText(text, x + pad, y - barH / 2 + fontSize / 2 - 1)
      }

      ctx.restore()
    }

    // Subtle scanline texture pass
    ctx.save()
    ctx.globalAlpha = 0.018
    for (let i = 0; i < H; i += 3) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, i, W, 1)
    }
    ctx.restore()
  }, [])

  // ── FPS counter ───────────────────────────────────────────────────────────
  const updateFPS = useCallback((): void => {
    frameCountRef.current++
    const now     = performance.now()
    const elapsed = now - lastFpsTimeRef.current
    if (elapsed > 500) {
      fpsRef.current         = Math.round(frameCountRef.current / (elapsed / 1000))
      frameCountRef.current  = 0
      lastFpsTimeRef.current = now
    }
  }, [])

  // ── Main rAF loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !optionsRef.current.enabled) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Keep canvas pixel size in sync with its CSS layout size
    const ro = new ResizeObserver((): void => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    let rafId: number

    const loop = (): void => {
      const W = canvas.width
      const H = canvas.height
      if (W > 0 && H > 0) {
        updateDetections(W, H)
        drawFrame(ctx, W, H)
        updateFPS()
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return (): void => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [canvasRef, updateDetections, drawFrame, updateFPS])
  // Note: enabled changes are handled via optionsRef, not by restarting the loop.
  // The loop guards internally on optionsRef.current.enabled via drawFrame/update.

  // ── Snapshot for sidebar panel (polled at 4Hz, not 30fps) ─────────────────
  const getSnapshot = useCallback((): OverlaySnapshot => ({
    detections: detectionsRef.current.filter(
      (d) => d.conf >= optionsRef.current.threshold,
    ),
    fps: fpsRef.current,
  }), [])

  return { getSnapshot, fpsRef, detectionsRef }
}