const { Producto } = require('../models');

const crearProducto = async (req, res) => {
  try {
    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listarProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await producto.update(req.body);
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearProducto,
  listarProductos,
  editarProducto,
  eliminarProducto,
};
