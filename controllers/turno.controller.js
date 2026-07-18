const turnoService = require('../services/turno.service');

const crearTurno = async (req, res) => {
  try {
    const turno = await turnoService.crearTurno(req.body);
    res.status(201).json(turno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listarTurnos = async (req, res) => {
  try {
    const turnos = await turnoService.listarTurnos();
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarTurno = async (req, res) => {
  try {
    const turno = await turnoService.editarTurno(req.params.id, req.body);
    res.json(turno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const cancelarTurno = async (req, res) => {
  try {
    const turno = await turnoService.cancelarTurno(req.params.id);
    res.json(turno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const horariosDisponibles = async (req, res) => {
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
};

module.exports = {
  crearTurno,
  listarTurnos,
  editarTurno,
  cancelarTurno,
  horariosDisponibles,
};
