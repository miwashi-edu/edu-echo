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
