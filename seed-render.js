const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(
  'postgresql://leonel055:1eLZf9tCZS9tGSwoSJLWUsGhXwomE0TK@dpg-d9f5htfavr4c73c6o1k0-a.oregon-postgres.render.com/mariglamour',
  {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  }
);

async function seed() {
  const [users] = await sequelize.query(
    'SELECT id FROM "Usuarios" LIMIT 1'
  );

  if (users.length > 0) {
    console.log('Ya existe un usuario admin.');
  } else {
    const hash = await bcrypt.hash('mariglamour789', 10);
    await sequelize.query(
      'INSERT INTO "Usuarios" (id, email, password, "createdAt", "updatedAt") VALUES (gen_random_uuid(), :email, :pass, NOW(), NOW())',
      { replacements: { email: 'mari@gmail.com', pass: hash } }
    );
    console.log('Usuario mari@gmail.com creado.');
  }

  const [serv] = await sequelize.query('SELECT count(*) as total FROM "Servicios"');
  console.log('Servicios en Render:', serv[0].total);

  const [turnos] = await sequelize.query('SELECT count(*) as total FROM "Turnos"');
  console.log('Turnos en Render:', turnos[0].total);

  const [clientes] = await sequelize.query('SELECT count(*) as total FROM "Clientes"');
  console.log('Clientes en Render:', clientes[0].total);

  await sequelize.close();
}

seed().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
