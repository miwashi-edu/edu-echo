# edu-echo

```bash
cd ~
cd ws
rm -rf http-logger
mkdir http-logger
cd http-logger
npm init -y
mkdir src
touch ./src/app.js
npm pkg set scripts.start="node ./src/app.js"
npm install express
echo "node_modules" > .gitignore
```

```bash
cat > ./src/app.js << 'EOF'
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

const requestLog = []

app.use((req, res, next) => {
  const entry = {
    method: req.method,
    path: req.path,
    time: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  }

  requestLog.push(entry)
  if (requestLog.length > 100) requestLog.shift()
  console.log(entry)
  next()
})

app.get('*', (req, res) => {
  res.json({
    message: 'Logged',
    recent: requestLog.slice(-10).reverse() // show last 10 in reverse
  })
})

app.listen(PORT, () => {
  console.log(`Logger running on port ${PORT}`)
})
EOF
```

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



