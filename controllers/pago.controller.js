const { Pedido, DetallePedido, Pago, Producto } = require('../models');
const { getProveedorPago } = require('../services/pagos');
const { Op } = require('sequelize');

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

    await DetallePedido.bulkCreate(
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
    const result = await proveedor.createPreference(pedido, detallesData, buyer);

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

const confirmarPago = async (req, res) => {
  try {
    const { pedidoId, paymentId } = req.body;

    if (!pedidoId || !paymentId) {
      return res.status(400).json({ error: 'pedidoId y paymentId son obligatorios' });
    }

    const pedido = await Pedido.findByPk(pedidoId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (pedido.estado === 'PAGADO') {
      const pago = await Pago.findOne({ where: { pedidoId } });
      return res.json({ pedidoId, estado: 'PAGADO', yaProcesado: true });
    }

    const proveedor = getProveedorPago();
    const paymentInfo = await proveedor.verifyPayment(paymentId);

    if (paymentInfo.status === 'approved') {
      await procesarPagoAprobado(pedido, paymentId, paymentInfo);
      return res.json({ pedidoId, estado: 'PAGADO' });
    }

    return res.json({ pedidoId, estado: paymentInfo.status });
  } catch (error) {
    console.error('Error al confirmar pago:', error.message);
    res.status(500).json({ error: error.message || 'Error al confirmar pago' });
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

async function procesarPagoAprobado(pedido, paymentId, paymentInfo) {
  await Pedido.update(
    { estado: 'PAGADO' },
    { where: { id: pedido.id } }
  );

  await Pago.update(
    {
      paymentId,
      estado: 'APROBADO',
      metodoPago: paymentInfo.paymentMethodId || 'mercadopago',
    },
    { where: { pedidoId: pedido.id } }
  );

  const detalles = await DetallePedido.findAll({
    where: { pedidoId: pedido.id },
  });

  for (const detalle of detalles) {
    await Producto.increment(
      { stock: -detalle.cantidad },
      {
        where: {
          id: detalle.productoId,
          stock: { [Op.gte]: detalle.cantidad },
        },
      }
    );
  }

  console.log(`Pedido ${pedido.id} pagado. Stock actualizado.`);
}

module.exports = {
  createPreference,
  confirmarPago,
  obtenerPedido,
  listarPedidos,
};
