import { Router } from 'express'
import { RtmTokenBuilder, RtmRole } from 'agora-access-token'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()

const APP_ID = process.env.AGORA_APP_ID!
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!

router.get('/rtm-token', (req, res) => {
  const uid = req.query.uid as string

  if (!uid) {
    return res.status(400).json({ error: 'uid required' })
  }

  const expire = Math.floor(Date.now() / 1000) + 3600

  const token = RtmTokenBuilder.buildToken(
    APP_ID,
    APP_CERTIFICATE,
    uid,
    RtmRole.Rtm_User,
    expire
  )

  res.json({ token })
})

export default router