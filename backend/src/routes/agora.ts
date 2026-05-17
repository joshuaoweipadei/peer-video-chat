import { Router, Request, Response } from 'express'
import { RtmTokenBuilder } from 'agora-token'

const router = Router()

// Runtime env guard
// These are guaranteed by the startup check in server.ts,
// but we assert here too for type safety within this module.
const APP_ID = process.env['AGORA_APP_ID'] as string
const APP_CERTIFICATE = process.env['AGORA_APP_CERTIFICATE'] as string

// Token validity in seconds — default 1 hour, overridable via env
const TOKEN_EXPIRE_SECONDS = Number(process.env['AGORA_TOKEN_EXPIRE'] ?? 3600)

// UID validation
// Agora RTM UIDs: string, max 64 bytes, no spaces or special chars
const UID_REGEX = /^[a-zA-Z0-9_\-\.]{1,64}$/

/**
 * GET /api/agora/rtm-token
 *
 * Query params:
 *   uid  — the user's unique ID (string, required)
 *
 * Response:
 *   { token: string, uid: string, expiresAt: number }
 *
 * Used by the frontend to get a short-lived RTM token so the
 * App Certificate is never exposed in the browser.
 */

router.get('/rtm-token', (req: Request, res: Response): void => {
  const uid = req.query['uid'] as string | undefined

  // Validate uid
  if (!uid) {
    res.status(400).json({ error: 'uid query parameter is required' })
    return
  }

  if (!UID_REGEX.test(uid)) {
    res.status(400).json({
      error: 'uid must be 1–64 characters: letters, numbers, _ - . only',
    })
    return
  }

  // Validate server config
  if (!APP_ID || !APP_CERTIFICATE) {
    console.error('[agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE')
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }

  // Build RTM token
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_EXPIRE_SECONDS

  const token = RtmTokenBuilder.buildToken(
    APP_ID,
    APP_CERTIFICATE,
    uid,
    expiresAt,
  )

  console.log(`[agora] RTM token issued for uid="${uid}" expires=${new Date(expiresAt * 1000).toISOString()}`)

  res.json({
    token,
    uid,
    expiresAt, // Unix timestamp — frontend can schedule a refresh
    expiresIn: TOKEN_EXPIRE_SECONDS,
  })
})

export default router