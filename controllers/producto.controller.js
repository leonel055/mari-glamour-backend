const { Producto, ProductoImagen } = require('../models');

const crearProducto = async (req, res) => {
  try {
    const { imagenes, ...data } = req.body;
    const producto = await Producto.create(data);
    if (Array.isArray(imagenes) && imagenes.length > 0) {
      await ProductoImagen.bulkCreate(
        imagenes.map((img, i) => ({
          productoId: producto.id,
          imagen: img,
          orden: i,
        }))
      );
    }
    const result = await Producto.findByPk(producto.id, {
      include: [{ association: 'imagenes', attributes: ['id', 'imagen', 'orden'] }],
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listarProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ association: 'imagenes', attributes: ['id', 'imagen', 'orden'] }],
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ association: 'imagenes' }],
    });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const { imagenes, ...data } = req.body;
    await producto.update(data);
    if (Array.isArray(imagenes)) {
      await ProductoImagen.destroy({ where: { productoId: producto.id } });
      if (imagenes.length > 0) {
        await ProductoImagen.bulkCreate(
          imagenes.map((img, i) => ({
            productoId: producto.id,
            imagen: img,
            orden: i,
          }))
        );
      }
    }
    const result = await Producto.findByPk(producto.id, {
      include: [{ association: 'imagenes', attributes: ['id', 'imagen', 'orden'] }],
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ association: 'imagenes', attributes: ['id', 'imagen', 'orden'] }],
    });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

const toggleEstado = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    producto.activo = !producto.activo;
    await producto.save();
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearProducto,
  listarProductos,
  obtenerProducto,
  editarProducto,
  eliminarProducto,
  toggleEstado,
};
