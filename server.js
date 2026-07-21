require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const autenticar = require('./middlewares/autenticar');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const servicioRoutes = require('./routes/servicio.routes');
const clienteRoutes = require('./routes/cliente.routes');
const turnoRoutes = require('./routes/turno.routes');
const cursoRoutes = require('./routes/curso.routes');
const productoRoutes = require('./routes/producto.routes');

const app = express();

const isProd = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: isProd
      ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : '*')
      : (origin, cb) => cb(null, true),
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

app.use('/api/servicios', autenticar, servicioRoutes);
app.use('/api/clientes', autenticar, clienteRoutes);
app.use('/api/turnos', autenticar, turnoRoutes);
app.use('/api/cursos', autenticar, cursoRoutes);
app.use('/api/productos', autenticar, productoRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexion a PostgreSQL exitosa.');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('Modelos sincronizados con la base de datos.');
    }

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    console.error(error)
    process.exit(1);
  }
}

startServer();
