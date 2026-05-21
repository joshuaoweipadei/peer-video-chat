import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Track rooms: roomId -> Set of socket IDs
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── Join Room ──────────────────────────────────────────────────────────────
  socket.on("join-room", ({ email, room }) => {
    if (!email || !room) return;

    const trimmedRoom = room.trim();
    socket.join(trimmedRoom);

    // Track participants
    if (!rooms.has(trimmedRoom)) rooms.set(trimmedRoom, new Set());
    rooms.get(trimmedRoom).add(socket.id);

    const roomSize = rooms.get(trimmedRoom).size;
    console.log(
      `[join-room] ${email} (${socket.id}) → room "${trimmedRoom}" (${roomSize} peers)`,
    );

    // Tell existing peers someone joined
    socket.to(trimmedRoom).emit("user-joined", { email, id: socket.id });

    // Confirm back to the joining socket
    io.to(socket.id).emit("join-room", { email, room: trimmedRoom });
  });

  // ── WebRTC Signaling ───────────────────────────────────────────────────────
  socket.on("start-call", ({ to, offer }) => {
    console.log(`[start-call] ${socket.id} → ${to}`);
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, ans }) => {
    console.log(`[answer] ${socket.id} → ${to}`);
    io.to(to).emit("answer", { from: socket.id, ans });
  });

  socket.on("peer-nego-needed", ({ to, offer }) => {
    console.log(`[peer-nego-needed] ${socket.id} → ${to}`);
    io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
  });

  socket.on("peer-nego-done", ({ to, ans }) => {
    console.log(`[peer-nego-done] ${socket.id} → ${to}`);
    io.to(to).emit("peer-nego-final", { from: socket.id, ans });
  });

  // ── ICE Candidates (trickle ICE) ───────────────────────────────────────────
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("peer-disconnected", { id: socket.id });
        const roomPeers = rooms.get(room);
        if (roomPeers) {
          roomPeers.delete(socket.id);
          if (roomPeers.size === 0) rooms.delete(room);
        }
        console.log(`[-] ${socket.id} left room "${room}"`);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[-] Socket disconnected: ${socket.id}`);
  });
});

if (process.env["NODE_ENV"] !== "production") {
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`\n🚀 PeerChat server running on http://localhost:${PORT}\n`);
  });
}

// Vercel serverless export
export default app;

// import express, { Request, Response, NextFunction } from 'express'
// import cors from 'cors'
// import dotenv from 'dotenv'
// import agoraRouter from './routes/agora'
//
// dotenv.config()
//
// const REQUIRED_ENV = ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'] as const
// for (const key of REQUIRED_ENV) {
//   if (!process.env[key]) {
//     console.error(`[server] Missing required environment variable: ${key}`)
//     process.exit(1)
//   }
// }
//
// const app = express()
//
// // CORS - restrict to your frontend origin in production
// const allowedOrigins = process.env['FRONTEND_URL']
//   ? [process.env['FRONTEND_URL']]
//   : ['http://localhost:5173'] // Vite default dev port
//
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (e.g. curl, Postman, server-to-server)
//       if (!origin) return callback(null, true)
//       if (allowedOrigins.includes(origin)) return callback(null, true)
//       callback(new Error(`CORS: origin ${origin} not allowed`))
//     },
//     methods: ['GET'],
//     credentials: false,
//   }),
// )
//
// app.use(express.json())
//
// // Routes
// app.get('/api/health', (_req: Request, res: Response) => {
//   res.json({
//     status: 'ok',
//     timestamp: new Date().toISOString(),
//     env: process.env['NODE_ENV'] ?? 'development',
//   })
// })
//
// app.use('/api/agora', agoraRouter)
//
// // 404 handler
// app.use((_req: Request, res: Response) => {
//   res.status(404).json({ error: 'Not found' })
// })
//
// // Global error handler
// app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
//   console.error('[server] Unhandled error:', err.message)
//   res.status(500).json({ error: 'Internal server error' })
// })
//
// // Local dev server
// // Vercel ignores listen() in production - it uses the default export instead
// if (process.env['NODE_ENV'] !== 'production') {
//   const PORT = process.env['PORT'] ?? 8080
//   app.listen(PORT, () => {
//     console.log(`[server] Running on http://localhost:${PORT}`)
//     console.log(`[server] Health: http://localhost:${PORT}/api/health`)
//     console.log(`[server] RTM Token: http://localhost:${PORT}/api/agora/rtm-token?uid=test123`)
//   })
// }
//
// // Vercel serverless export
// export default app
