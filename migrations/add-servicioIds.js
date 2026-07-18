require('dotenv').config();
const sequelize = require('../config/database');

async function migrate() {
  try {
    await sequelize.query(`
      ALTER TABLE "Turnos"
      ADD COLUMN IF NOT EXISTS "servicioIds" TEXT[] DEFAULT '{}';
    `);
    console.log('Columna servicioIds agregada correctamente');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('La columna servicioIds ya existe');
      process.exit(0);
    }
    console.error('Error:', error.message);
    process.exit(1);
  }
}

migrate();
