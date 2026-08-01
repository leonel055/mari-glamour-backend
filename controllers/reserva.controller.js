const { Turno, Servicio } = require('../models');
const turnoService = require('../services/turno.service');
const { getProveedorPago } = require('../services/pagos');
const { notificarNuevaReserva } = require('../services/whatsapp.service');
const { Op } = require('sequelize');

const crearReserva = async (req, res) => {
  try {
    const { servicioIds, fecha, horaInicio, clienteNombre, clienteWhatsApp, observaciones } = req.body;

    const turno = await turnoService.crearReservaOnline({
      servicioIds,
      fecha,
      horaInicio,
      clienteNombre,
      clienteWhatsApp,
      observaciones,
    });

    const servicios = await Servicio.findAll({
      where: { id: { [Op.in]: turno.servicioIds } },
    });

    try {
      const proveedor = getProveedorPago();
      const result = await proveedor.createTurnoPreference(
        turno,
        servicios,
        turno.montoSenia,
        { nombre: clienteNombre }
      );

      await Turno.update(
        { preferenceId: result.preferenceId },
        { where: { id: turno.id } }
      );

      res.status(201).json({
        turnoId: turno.id,
        preferenceId: result.preferenceId,
        initPoint: result.initPoint,
        montoSenia: turno.montoSenia,
      });
    } catch (prefError) {
      await Turno.update(
        { estado: 'CANCELADO', reservaExpira: null },
        { where: { id: turno.id } }
      );
      console.error('Error creando preferencia:', prefError.message);
      res.status(500).json({ error: prefError.message || 'Error al generar el pago' });
    }
  } catch (error) {
    console.error('Error al crear reserva:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const confirmarReserva = async (req, res) => {
  try {
    const { turnoId, paymentId } = req.body;

    if (!turnoId || !paymentId) {
      return res.status(400).json({ error: 'turnoId y paymentId son obligatorios' });
    }

    const turno = await Turno.findByPk(turnoId);
    if (!turno) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (turno.estado === 'CONFIRMADO' && turno.seniaPagada) {
      return res.json({ turnoId, estado: 'CONFIRMADO', yaProcesado: true });
    }

    const proveedor = getProveedorPago();
    const paymentInfo = await proveedor.verifyPayment(paymentId);

    if (paymentInfo.status !== 'approved') {
      return res.status(200).json({ turnoId, estado: paymentInfo.status });
    }

    const confirmado = await turnoService.confirmarReserva(turnoId, paymentId, paymentInfo);

    const servicios = await Servicio.findAll({
      where: { id: { [Op.in]: confirmado.servicioIds } },
    });

    notificarNuevaReserva(confirmado, servicios, confirmado.montoSenia);

    res.json({ turnoId, estado: 'CONFIRMADO' });
  } catch (error) {
    console.error('Error al confirmar reserva:', error.message);
    res.status(400).json({ error: error.message });
  }
};

const obtenerReserva = async (req, res) => {
  try {
    const turno = await turnoService.obtenerReserva(req.params.id);
    res.json(turno);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

module.exports = {
  crearReserva,
  confirmarReserva,
  obtenerReserva,
};
