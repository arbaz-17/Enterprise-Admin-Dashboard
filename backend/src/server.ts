import 'dotenv/config'
import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 5000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid number between 1 and 65535')
}

app.use(express.json())

// Simple endpoint to verify the frontend-to-backend connection.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'enterprise-admin-dashboard-api' })
})

app.listen(port, () => {
  console.log(`Express backend running at http://localhost:${port}`)
})
