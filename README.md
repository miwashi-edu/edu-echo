# edu-echo

## Clone & Run

```bash
git clone https://github.com/miwashi-edu/edu-echo
cd edu-echo
npm install
npm start
# OR
docker compose up --build
# OR
docker build -t http-logger .
docker run -d --name http-logger -h http-logger --network iotnet -p 3000:3000 -p 9000:9000 -p 9001:9001/udp http-logger
```

## Test

```bash
curl -X POST -H "Content-Type: application/json" -d '{"msg":"hello from curl"}' http://localhost:3000
echo "hello from udp" | nc -u -w1 127.0.0.1 9001
echo "hello from tcp" | nc 127.0.0.1 9000
```


## Instructions

```bash
cd ~
cd ws
rm -rf http-logger
mkdir http-logger
cd http-logger
npm init -y
npm pkg set scripts.start="node ./src/start.js"
npm pkg set scripts.dev="node --watch ./src/start.js"
npm pkg set scripts.build="docker build -t http-logger ."
npm pkg set scripts.docker="docker run -d -h logger --name http-logger --network iotnet -p 3000:3000 -p 9000:9000 -p 9001:9001/udp http-logger"
npm install express
npm install dgram
npm install net
mkdir public
touch ./public/index.html
touch ./public/index.js
touch ./public/index.css
mkdir src
touch ./src/start.js
touch ./src/app.js
touch ./src/tcp.js
touch ./src/udp.js
curl -o .gitignore https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore
```

## ./src/start.js

```bash
cat > ./src/start.js << 'EOF'
const startTCP = require('./tcp')
const startUDP = require('./udp')

startTCP()
startUDP()

require('./app')
EOF
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

## ./src/tcp.js

```bash
cat > ./src/tcp.js << 'EOF'
const net = require('net')
const http = require('http')
const TCP_PORT = process.env.TCP_PORT || 9000
const PORT = process.env.PORT || 3000
const TARGET = `http://localhost:${PORT}`

function sendLog(data) {
  const body = JSON.stringify(data)
  const req = http.request(TARGET, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': body.length }
  })
  req.write(body)
  req.end()
}

module.exports = function startTCP() {
  const server = net.createServer(socket => {
    sendLog({ type: 'tcp', event: 'connect', ip: socket.remoteAddress })

    socket.on('data', data => {
      console.log(`TCP Message received ${data}`);
      sendLog({ type: 'tcp', event: 'data', ip: socket.remoteAddress, message: data.toString() })
      socket.write(data)
    })

    socket.on('end', () => {
      sendLog({ type: 'tcp', event: 'disconnect', ip: socket.remoteAddress })
    })
  })

  server.listen(TCP_PORT, () => {
    sendLog({ type: 'tcp', event: 'start', port: TCP_PORT })
  })
  console.log('TCP server started');
}
EOF
```

## ./src/udp.js

```bash
cat > ./src/upd.js << 'EOF'
const dgram = require('dgram')
const http = require('http')
const UDP_PORT = process.env.UDP_PORT || 9001
const PORT = process.env.PORT || 3000
const TARGET = `http://localhost:${PORT}`

function sendLog(data) {
    const body = JSON.stringify(data)
    const req = http.request(TARGET, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Content-Length': body.length}
    })
    req.write(body)
    req.end()
}

module.exports = function startUDP() {
    const server = dgram.createSocket('udp4');

    server.on('message', (msg, rinfo) => {
        console.log(`UDP Message received ${msg}`);
        sendLog({
            type: 'udp',
            event: 'message',
            ip: rinfo.address,
            port: rinfo.port,
            message: msg.toString()
        })
        server.send(msg, rinfo.port, rinfo.address)
    })

    server.on('listening', function () {
        var address = server.address();
        var port = address.port;
        var family = address.family;
        var ipaddr = address.address;
        console.log(`Server is listening at port ${port}`);
        console.log('Server ip :' + ipaddr);
        console.log('Server is IP4/IP6 : ' + family);
    });

    server.on('error', function (error) {
        console.log('Error: ' + error);
        server.close();
    });

    server.on('close', function () {
        console.log('Socket is closed !');
    });

    server.bind(UDP_PORT, () => {
      console.log('bind');
      sendLog({ type: 'udp', event: 'start', port: UDP_PORT })
    });

    console.log('UDP server started');
}
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
body {
  font-family: sans-serif;
  padding: 1rem;
  background: #f9f9f9;
}

.bubble {
  background: #e0f7fa;
  border: 1px solid #00acc1;
  border-radius: 1rem;
  padding: 0.75rem 1.25rem;
  margin: 0.5rem 0;
  max-width: 600px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.bubble:hover {
  transform: scale(1.02);
}

.meta {
  font-size: 0.8rem;
  color: #555;
}

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
function fetchLogs() {
    const container = document.getElementById('logs')
    container.innerHTML = '' // Clear previous logs

    fetch('/logs')
        .then(res => res.json())
        .then(logs => {
            logs.forEach(entry => {
                const div = document.createElement('div')
                div.className = 'bubble'
                div.innerHTML = `
          <div><strong>${entry.method || entry.type}</strong> <code>${entry.path || entry.event}</code></div>
          <div class="meta">${entry.time} — ${entry.ip}</div>
          <details>
            <summary>Details</summary>
            <pre>${JSON.stringify(entry, null, 2)}</pre>
          </details>
        `
                container.appendChild(div)
            })
        })
}

window.addEventListener('DOMContentLoaded', () => {
    fetchLogs()
    document.getElementById('refresh').addEventListener('click', fetchLogs)
})
EOF
```

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
## docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  http-logger:
    image: http-logger
    container_name: http-logger
    hostname: logger
    networks:
      - iotnet
    ports:
      - "3000:3000"       # HTTP
      - "9000:9000"       # TCP Echo
      - "9001:9001/udp"   # UDP Echo
    restart: unless-stopped

networks:
  iotnet:
    external: true
EOF
```

## Run

```bash
docker build -t http-logger .
docker run -d --name http-logger -h http-logger --network iotnet -p 3000:3000 -p 9000:9000 -p 9001:9001/udp http-logger
```

## Run with docker compose

```bash
docker compose up --build
```



