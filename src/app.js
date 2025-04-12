const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

const requestLog = []

app.use(express.json()) // For JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/logs', (req, res) => {
  res.json(requestLog.slice(-10).reverse())
})

app.use((req, res) => {
  const entry = {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    time: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    query: req.query,
    headers: req.headers,
    hostname: req.hostname,
    userAgent: req.headers['user-agent'],
    body: req.body || {},
  }

  requestLog.push(entry)
  if (requestLog.length > 100) requestLog.shift()
  res.json({status: 'ok'});
})


app.listen(PORT, () => {
  console.log(`Logger running on port ${PORT}`)
})
