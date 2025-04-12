# edu-echo

## Instructions

```bash
cd ~
cd ws
rm -rf http-logger
mkdir http-logger
cd http-logger
npm init -y
mkdir public
touch ./public/index.html
touch ./public/index.js
touch ./public/index.css
mkdir src
touch ./src/app.js
npm pkg set scripts.start="node ./src/app.js"
npm pkg set scripts.dev="node --watch ./src/app.js"
npm pkg set scripts.build="docker build -t http-logger ."
npm pkg set scripts.docker="docker run -p 3000:3000 http-logger"
npm install express
echo "node_modules" > .gitignore
```

## ./src/app.js

```bash
cat > ./src/app.js << 'EOF'
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
EOF
```

## ./public/index.html

```bash
cat >> ./public/index.css << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Request Log</title>
    <link rel="stylesheet" href="/index.css">
    <script src="/index.js" defer></script>
</head>
<body>
<h1>Recent Logs</h1>
<div id="logs"></div>
</body>
</html>
EOF
```

## ./public/index.css

```bash
cat >> ./public/index.css << 'EOF'
.meta {
  color: #666;
  font-size: 0.9em;
}

details {
  margin-top: 0.5em;
}

pre {
  background: #f9f9f9;
  padding: 0.5em;
  border-radius: 0.5em;
  overflow-x: auto;
}
EOF
```

## ./public/index.js

```bash
cat > ./public/index.js << 'EOF'
window.onload = () => {
  fetch('/logs')
    .then(res => res.json())
    .then(logs => {
      const container = document.getElementById('logs')
      logs.forEach(entry => {
        const div = document.createElement('div')
        div.className = 'bubble'
        div.innerHTML = `
          <div><strong>${entry.method}</strong> <code>${entry.originalUrl}</code></div>
          <div class="meta">${entry.time} — ${entry.ip}</div>
          <details>
            <summary>Details</summary>
            <pre>${JSON.stringify({
              query: entry.query,
              headers: entry.headers,
              body: entry.body,
              hostname: entry.hostname,
              userAgent: entry.userAgent
            }, null, 2)}</pre>
          </details>
        `
        container.appendChild(div)
      })
    })
}
EOF
``

## Dockerfile

```bash
cat > Dockerfile << 'EOF'
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
EOF
```

```bash
cat > docker-compose.yml << 'EOF'
version: '3.9'
services:
  logger:
    build: .
    ports:
      - "3000:3000"
EOF
```

## Run

```bash
docker build -t http-logger .
docker run -p 3000:3000 http-logger
```

## Run with docker

```bash
docker compose up --build
```



