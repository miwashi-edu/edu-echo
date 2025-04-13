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
