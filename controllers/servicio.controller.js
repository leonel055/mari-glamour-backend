const { Servicio } = require('../models');

const crearServicio = async (req, res) => {
  try {
    const servicio = await Servicio.create(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listarServicios = async (req, res) => {
  try {
    const servicios = await Servicio.findAll();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    await servicio.update(req.body);
    res.json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    await servicio.destroy();
    res.json({ mensaje: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearServicio,
  listarServicios,
  editarServicio,
  eliminarServicio,
};
