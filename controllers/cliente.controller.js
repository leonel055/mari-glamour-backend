const { Cliente } = require('../models');

const crearCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listarClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    await cliente.update(req.body);
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    await cliente.destroy();
    res.json({ mensaje: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearCliente,
  listarClientes,
  editarCliente,
  eliminarCliente,
};
