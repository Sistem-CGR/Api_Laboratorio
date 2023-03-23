const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors({ origin: '*' }));


// create a tcp modbus client
const Modbus = require('jsmodbus')
const net = require('net');

const socket = new net.Socket()
const clientPLC = new Modbus.client.TCP(socket)
const options = {
    'host' : '192.168.1.30',
    'port' : 502
}

socket.connect(options);

socket.on('error', err =>  console.log(err));

/*----------------------------------------------------------------------------------------------------------------------------------------------------------------------\
|   FUNCIONES DE LA API (lECTURA DE REGISTROS   /   LECTURA DE REGISTROS    /   ENCEDER BOBINAS /   APAGAR BOBINAS  /   ALMACENAR INFORMACION EN LA BASE DE DATOS)      |
\----------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

// Conexion al PLC
let connect = (req, res) => {
    clientPLC.readHoldingRegisters(0, 7).then(result => {
        res.status(200).json(true)
    }).catch(function () {
        console.error( "Conectar " + require('util').inspect(arguments, { depth: null}))
        res.status(202).json(false)
    })
}

let reconnect = (req, res) => {
    let status = socket.resume()._readableState.destroyed
    status ? socket.connect(options) : "";

    clientPLC.readHoldingRegisters(0, 7).then(result => {
        res.status(200).json(true)
    }).catch(function () {
        console.error( "Reconectar " + require('util').inspect(arguments, { depth: null}))
        res.status(202).json(false)
    })
}

// Fubnción pare lectura de bobinas
let readCoils = ( req, res ) => {
    const { start, end } = req.body
    clientPLC.readCoils(start, end).then(result => {
        let Bobinas = result.response._body._valuesAsArray
        res.status(200).json(Bobinas)
    }).catch(function () {
        console.error("readCoils " + require('util').inspect(arguments, { depth: null}))
        res.status(202).json(require('util').inspect(arguments, { depth: null}))
    })
}

// Fubnción pare lectura de bobinas
let readHoldingRegisters = ( req, res ) => {
    let status = socket.resume()._readableState.destroyed    
    status ? socket.connect(options) : "";

    const { start, end } = req.body
    
    clientPLC.readHoldingRegisters(start, end).then(result => {
        let Registros = result.response._body._valuesAsArray
        res.status(200).json(Registros)
    }).catch(function () {
        console.error("readHoldingRegisters " + require('util').inspect(arguments, { depth: null}))
        res.status(202).json(require('util').inspect(arguments, { depth: null}))
    })
}

// Fubnción pare lectura de bobinas
let dataRegisters = ( req, res ) => {
    clientPLC.readHoldingRegisters(0, 102).then(result => {
        data = result.response._body._valuesAsArray
        let Presion = parseFloat(data[100] / 100).toFixed(4);
        let Flujo = data[101]
        let Flujo_Ajuste = parseFloat((Flujo / 10) - 5.9).toFixed(4);

        // Voltajes
            let buf1 = Buffer.allocUnsafe(4);
            buf1.writeUInt16BE(data[3],2);
            buf1.writeUInt16BE(data[4],0);
            let VL1L2 = buf1.readFloatBE(0).toFixed(4);

            let buf2 = Buffer.allocUnsafe(4);
            buf2.writeUInt16BE(data[8],2);
            buf2.writeUInt16BE(data[9],0);
            let VL2L3 = buf2.readFloatBE(0).toFixed(4);

            let buf3 = Buffer.allocUnsafe(4);
            buf3.writeUInt16BE(data[10],2);
            buf3.writeUInt16BE(data[11],0);
            let VL3L1 = buf3.readFloatBE(0).toFixed(4);

        // Corrientes
            let buf4 = Buffer.allocUnsafe(4);
            buf4.writeUInt16BE(data[12],2);
            buf4.writeUInt16BE(data[13],0);
            let IL1 = buf4.readFloatBE(0).toFixed(4);

            let buf5 = Buffer.allocUnsafe(4);
            buf5.writeUInt16BE(data[14],2);
            buf5.writeUInt16BE(data[15],0);
            let IL2 = buf5.readFloatBE(0).toFixed(4);
            
            let buf6 = Buffer.allocUnsafe(4);
            buf6.writeUInt16BE(data[16],2);
            buf6.writeUInt16BE(data[17],0);
            let IL3 = buf6.readFloatBE(0).toFixed(4);

        // FATORES DE POTENCIA
            let buf7 = Buffer.allocUnsafe(4);
            buf7.writeUInt16BE(data[42],2);
            buf7.writeUInt16BE(data[43],0);
            let FP1 = (buf7.readFloatBE(0) * 100).toFixed(4);

            let buf8 = Buffer.allocUnsafe(4);
            buf8.writeUInt16BE(data[44],2);
            buf8.writeUInt16BE(data[45],0);
            let FP2 = (buf8.readFloatBE(0) * 100).toFixed(4);
            
            let buf9 = Buffer.allocUnsafe(4);
            buf9.writeUInt16BE(data[46],2);
            buf9.writeUInt16BE(data[47],0);
            let FP3 = (buf9.readFloatBE(0) * 100).toFixed(4);

            Flujo = (Flujo_Ajuste < 0) ? parseFloat(0).toFixed(2) : Flujo_Ajuste

        let arr = {Presion, Flujo, VL1L2, VL2L3, VL3L1, IL1, IL2, IL3, FP1, FP2, FP3 }
        res.status(200).json(arr)
    }).catch(function () {
        console.error('dataRegisters' + require('util').inspect(arguments, { depth: null}))
        res.status(202).json(require('util').inspect(arguments, { depth: null}))
    })    
}

// Función para encedido de bobinas
let coilON = (req, res) => {
    let status = socket.resume()._readableState.destroyed    
    status ? socket.connect(options) : "";

    const id = req.body.id == undefined ? req.params.id : req.body.id    

    clientPLC.writeSingleCoil(id, true).then(result => {
        res.status(200).json(result.response._body)
    }).catch(function () {
        console.error("ON", require('util').inspect(arguments, { depth: null}))
        res.status(202).json(equire('util').inspect(arguments, { depth: null}))
    })
}

// Función para apagado de bobinas
let coilOFF = (req, res) => {
    let status = socket.resume()._readableState.destroyed    
    status ? socket.connect(options) : "";    

    const id = req.body.id == undefined ? req.params.id : req.body.id

    clientPLC.writeSingleCoil(id, false).then(result => {
        res.status(200).json(result.response._body)
    }).catch(function () {
        console.error("OFF", require('util').inspect(arguments, { depth: null}))
        res.status(202).json(require('util').inspect(arguments, { depth: null}))
    })
}

// Función para escritura de bobinas
let writeSingleRegister = (req, res) => {
    const { id, value } = req.body
    clientPLC.writeSingleRegister(id, value).then(result => {
        res.status(200).json(result.response._body)
    }).catch(function () {
        console.error("writeSingleRegister" + require('util').inspect(arguments, { depth: null}))
        res.status(202).json(require('util').inspect(arguments, { depth: null}))
    })
}

/*----------------------------------------------------------------------------------------------------------------------------------------------------------------------\
|                                                                 PETICIONES A LA API POR METODOS GET Y POST                                                             |
\----------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

app.get('/', (req, res) => { res.json({ mensaje: 'Api jsmodbus metodo GET :) - LAboratorio de pruebas CGR' })})
app.post('/', (req, res) => {res.json({ mensaje: 'Api jsmodbus metodo POST :) - LAboratorio de pruebas CGR' })})

// Coneciíon al plc
    app.get('/connect', connect)
    app.post('/connect', connect)
    app.get('/reconnect', reconnect)
    app.post('/reconnect', reconnect)

// LECTURA DE BOBINAS
    app.post('/readCoils', readCoils)   // Parametros { start, end }

// LECTURA DE REGISTROS
    app.post('/readRegisters', readHoldingRegisters)    // Parametros { start, end }
    app.get('/dataRegisters', dataRegisters)
    app.post('/dataRegisters', dataRegisters)

// ESCRITURA DE REGISTROS
    app.post('/writeRegister', writeSingleRegister)    // Parametros { id, value }

// ENCEDIDO DE BOBINAS
    app.get('/coilon/:id', coilON)
    app.post('/coilon', coilON) // Parametros { id }

// APAGADO DE BOBINAS
    app.get('/coiloff/:id', coilOFF)
    app.post('/coiloff', coilOFF)    // Parametros { id }

module.exports = app