import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import agoraRouter from './routes/agora'

dotenv.config()

const REQUIRED_ENV = ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[server] Missing required environment variable: ${key}`)
    process.exit(1)
  }
}

const app = express()

// CORS - restrict to your frontend origin in production
const allowedOrigins = process.env['FRONTEND_URL']
  ? [process.env['FRONTEND_URL']]
  : ['http://localhost:5173'] // Vite default dev port

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    methods: ['GET'],
    credentials: false,
  }),
)

app.use(express.json())

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env['NODE_ENV'] ?? 'development',
  })
})

app.use('/api/agora', agoraRouter)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// Local dev server
// Vercel ignores listen() in production - it uses the default export instead
if (process.env['NODE_ENV'] !== 'production') {
  const PORT = process.env['PORT'] ?? 8080
  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`)
    console.log(`[server] Health: http://localhost:${PORT}/api/health`)
    console.log(`[server] RTM Token: http://localhost:${PORT}/api/agora/rtm-token?uid=test123`)
  })
}

// Vercel serverless export
export default app