const { Router } = require('express');
const { Servicio } = require('../models');
const turnoService = require('../services/turno.service');

const router = Router();

router.get('/servicios', async (req, res) => {
  try {
    const servicios = await Servicio.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']],
    });
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

router.get('/disponibilidad', async (req, res) => {
  try {
    const { fecha, servicioIds } = req.query;
    let ids = servicioIds;
    if (ids && typeof ids === 'string') {
      ids = ids.split(',').filter(Boolean);
    }
    const disponibles = await turnoService.horariosDisponibles(fecha, ids);
    res.json(disponibles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
