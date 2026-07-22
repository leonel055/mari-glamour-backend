const { Pedido, DetallePedido, Pago, Producto } = require('../models');
const { getProveedorPago } = require('../services/pagos');

const createPreference = async (req, res) => {
  try {
    const { items, buyer } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito esta vacio' });
    }
    if (!buyer?.nombre) {
      return res.status(400).json({ error: 'El nombre del comprador es obligatorio' });
    }

    const productos = await Producto.findAll({
      where: { id: items.map((i) => i.productoId) },
    });

    const productoMap = {};
    for (const p of productos) {
      productoMap[p.id] = p;
    }

    let total = 0;
    const detallesData = [];

    for (const item of items) {
      const producto = productoMap[item.productoId];
      if (!producto) {
        return res.status(400).json({ error: `Producto ${item.productoId} no encontrado` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`,
        });
      }
      const subtotal = Number(producto.precio) * item.cantidad;
      total += subtotal;
      detallesData.push({
        productoId: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        cantidad: item.cantidad,
      });
    }

    const pedido = await Pedido.create({
      clienteNombre: buyer.nombre,
      clienteEmail: buyer.email || null,
      clienteTelefono: buyer.telefono || null,
      total,
      estado: 'PENDIENTE',
    });

    const detalles = await DetallePedido.bulkCreate(
      detallesData.map((d) => ({
        pedidoId: pedido.id,
        productoId: d.productoId,
        cantidad: d.cantidad,
        precio: d.precio,
      }))
    );

    await Pago.create({
      pedidoId: pedido.id,
      monto: total,
      estado: 'PENDIENTE',
      metodoPago: 'mercadopago',
    });

    const proveedor = getProveedorPago();
    const result = await proveedor.createPreference(
      pedido,
      detallesData,
      buyer
    );

    await Pago.update(
      { preferenceId: result.preferenceId },
      { where: { pedidoId: pedido.id } }
    );

    res.json({
      pedidoId: pedido.id,
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
    });
  } catch (error) {
    console.error('Error al crear preferencia:', error.message);
    res.status(500).json({ error: error.message || 'Error al procesar el pago' });
  }
};

const obtenerPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        { association: 'detalles' },
        { association: 'pago' },
      ],
    });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { association: 'detalles' },
        { association: 'pago' },
      ],
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPreference,
  obtenerPedido,
  listarPedidos,
};
