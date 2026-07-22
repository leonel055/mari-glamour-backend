const { Pedido, Pago, DetallePedido, Producto } = require('../models');
const { getProveedorPago } = require('../services/pagos');
const { Op } = require('sequelize');

const mercadopagoWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== 'payment') {
      return res.status(200).json({ recibido: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(200).json({ recibido: true });
    }

    const proveedor = getProveedorPago();
    const paymentInfo = await proveedor.verifyPayment(paymentId);

    if (paymentInfo.status === 'approved') {
      const pago = await Pago.findOne({
        where: { preferenceId: paymentInfo.preferenceId },
      });

      if (!pago) {
        const pedido = await Pedido.findOne({
          where: {
            [Op.or]: [
              { id: paymentInfo.externalReference },
            ],
          },
        });

        if (pedido) {
          await procesarPagoAprobado(pedido, paymentId, paymentInfo);
        }
      } else {
        const pedido = await Pedido.findByPk(pago.pedidoId);
        if (pedido && pedido.estado === 'PENDIENTE') {
          await procesarPagoAprobado(pedido, paymentId, paymentInfo);
        }
      }
    }

    res.status(200).json({ recibido: true });
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error.message);
    res.status(200).json({ recibido: true });
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
  mercadopagoWebhook,
};
