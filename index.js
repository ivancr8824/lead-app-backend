const express = require('express');
const cors = require('cors');
require('dotenv').config();

//Crear el servidor de express
const app = express();

//Cors
app.use(cors());

//Directorio Publico
app.use(express.static('public'));

//Lectura y parseo del body
app.use(express.json());

//Rutas
app.use('/api/leads', require('./routes/leads'));
app.use('/api/campaign', require('./routes/campaign'));

//Escuchar peticiones
app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});