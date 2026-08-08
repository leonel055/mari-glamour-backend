const { Pedido, Pago, DetallePedido, Producto, Turno, Servicio, MpCredencial } = require('../models');
const { getProveedorPago } = require('../services/pagos');
const { Op } = require('sequelize');
const turnoService = require('../services/turno.service');
const { notificarNuevaReserva } = require('../services/whatsapp.service');

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

    const credencial = await MpCredencial.findOne();
    if (credencial && paymentInfo.userId && String(paymentInfo.userId) !== String(credencial.mpUserId)) {
      console.warn(
        `Webhook de cuenta Mercado Pago ${paymentInfo.userId} no coincide con la cuenta conectada ${credencial.mpUserId}.`
      );
    }

    if (paymentInfo.status === 'approved') {
      if (paymentInfo.externalReference && paymentInfo.externalReference.startsWith('TURNO-')) {
        const turnoId = paymentInfo.externalReference.replace('TURNO-', '');
        await procesarReservaAprobada(turnoId, paymentId, paymentInfo);
        return res.status(200).json({ recibido: true });
      }

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

async function procesarReservaAprobada(turnoId, paymentId, paymentInfo) {
  try {
    const confirmado = await turnoService.confirmarReserva(turnoId, paymentId, paymentInfo);

    const servicios = await Servicio.findAll({
      where: { id: { [Op.in]: confirmado.servicioIds } },
    });

    notificarNuevaReserva(confirmado, servicios, confirmado.montoSenia);
    console.log(`Reserva ${turnoId} confirmada y notificada por WhatsApp.`);
  } catch (error) {
    console.error('Error procesando reserva en webhook:', error.message);
  }
}

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
