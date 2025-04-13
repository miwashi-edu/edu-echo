const startTCP = require('./tcp')
const startUDP = require('./udp')

startTCP()
startUDP()

require('./app')
