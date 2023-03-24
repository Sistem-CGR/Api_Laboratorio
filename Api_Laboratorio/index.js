const express = require('express')
const app = express()

// Nos ayuda analizar el cuerpo de la  solicitud
app.use(express.json())
app.use(express.urlencoded( {extended: true} ))

// Cargamos el archivo de rutas
app.use(require('./routes/modbus'))

app.listen(8081)

module.exports = app;