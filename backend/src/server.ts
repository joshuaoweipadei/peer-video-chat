import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import agoraRouter from './routes/agora'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/agora', agoraRouter)

app.listen(8080, () => {
  console.log('Backend running on http://localhost:8080')
})