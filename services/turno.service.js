const { Turno, Servicio, Cliente } = require('../models');
const { Op } = require('sequelize');

const BASE_SLOTS = [
  { hora: '09:00', minutos: 540 },
  { hora: '10:30', minutos: 630 },
  { hora: '14:30', minutos: 870 },
  { hora: '16:00', minutos: 960 },
  { hora: '18:00', minutos: 1080 },
  { hora: '20:00', minutos: 1200 },
];

function calcularHoraFin(horaInicio, duracionMinutos) {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;
  const h = Math.floor(totalMinutos / 60) % 24;
  const m = totalMinutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

async function calcularDuracionTotal(servicioIds) {
  if (!servicioIds || servicioIds.length === 0) return 120;
  const servicios = await Servicio.findAll({
    where: { id: { [Op.in]: servicioIds } },
  });
  return servicios.reduce((total, s) => total + (s.duracion || 90), 0);
}

async function verificarSuperposicion(fecha, horaInicio, horaFin, turnoIdExclude) {
  const where = {
    fecha,
    estado: { [Op.ne]: 'CANCELADO' },
    [Op.and]: [
      { horaInicio: { [Op.lt]: horaFin } },
      { horaFin: { [Op.gt]: horaInicio } },
    ],
  };

  if (turnoIdExclude) {
    where.id = { [Op.ne]: turnoIdExclude };
  }

  const conflicto = await Turno.findOne({ where });
  return conflicto;
}

function horaEnMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

const crearTurno = async ({ clienteId, servicioId, servicioIds, fecha, horaInicio, costoAdicional, observaciones }) => {
  const fechaDate = new Date(fecha + 'T12:00:00');
  const diaSemana = fechaDate.getDay();
  if (diaSemana === 0) {
    throw new Error('No se pueden crear turnos los domingos');
  }

  const ids = servicioIds && servicioIds.length > 0
    ? servicioIds
    : servicioId
      ? [servicioId]
      : [];

  if (ids.length === 0) {
    throw new Error('Debes seleccionar al menos un servicio');
  }

  const serviciosExistentes = await Servicio.findAll({
    where: { id: { [Op.in]: ids } },
  });
  if (serviciosExistentes.length !== ids.length) {
    throw new Error('Uno o mas servicios no fueron encontrados');
  }

  const cliente = await Cliente.findByPk(clienteId);
  if (!cliente) {
    throw new Error('Cliente no encontrado');
  }

  const duracionTotal = await calcularDuracionTotal(ids);
  const horaFin = calcularHoraFin(horaInicio, duracionTotal);

  const conflicto = await verificarSuperposicion(fecha, horaInicio, horaFin);
  if (conflicto) {
    throw new Error(
      `Ya existe un turno en ese horario (${conflicto.horaInicio} - ${conflicto.horaFin})`
    );
  }

  const turno = await Turno.create({
    clienteId,
    servicioId: ids[0],
    servicioIds: ids,
    fecha,
    horaInicio,
    horaFin,
    costoAdicional: costoAdicional || 0,
    observaciones,
  });

  return turno;
};

const listarTurnos = async () => {
  const turnos = await Turno.findAll({
    include: [
      { model: Cliente, attributes: ['id', 'nombre', 'telefono'] },
      { model: Servicio, attributes: ['id', 'nombre', 'precio', 'duracion'] },
    ],
    order: [['fecha', 'ASC'], ['horaInicio', 'ASC']],
  });

  for (const turno of turnos) {
    if (turno.servicioIds && turno.servicioIds.length > 1) {
      const servicios = await Servicio.findAll({
        where: { id: { [Op.in]: turno.servicioIds } },
        attributes: ['id', 'nombre', 'precio', 'duracion'],
      });
      turno.dataValues.ServiciosExtra = servicios;
    }
  }

  return turnos;
};

const editarTurno = async (id, data) => {
  const turno = await Turno.findByPk(id);
  if (!turno) {
    throw new Error('Turno no encontrado');
  }

  const ids = data.servicioIds && data.servicioIds.length > 0
    ? data.servicioIds
    : data.servicioId
      ? [data.servicioId]
      : turno.servicioIds || [turno.servicioId];

  if (ids.length > 0) {
    const servicios = await Servicio.findAll({
      where: { id: { [Op.in]: ids } },
    });
    if (servicios.length !== ids.length) {
      throw new Error('Uno o mas servicios no fueron encontrados');
    }
  }

  if (data.clienteId) {
    const cliente = await Cliente.findByPk(data.clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
  }

  const nuevaFecha = data.fecha || turno.fecha;
  const nuevaHoraInicio = data.horaInicio || turno.horaInicio;
  let nuevaHoraFin = turno.horaFin;

  if (data.horaInicio || data.servicioIds || data.servicioId) {
    const duracionTotal = await calcularDuracionTotal(ids);
    nuevaHoraFin = calcularHoraFin(nuevaHoraInicio, duracionTotal);
  }

  const conflicto = await verificarSuperposicion(
    nuevaFecha,
    nuevaHoraInicio,
    nuevaHoraFin,
    id
  );
  if (conflicto) {
    throw new Error(
      `Ya existe un turno en ese horario (${conflicto.horaInicio} - ${conflicto.horaFin})`
    );
  }

  await turno.update({
    ...data,
    servicioId: ids[0],
    servicioIds: ids,
    horaFin: nuevaHoraFin,
  });

  return turno;
};

const cancelarTurno = async (id) => {
  const turno = await Turno.findByPk(id);
  if (!turno) {
    throw new Error('Turno no encontrado');
  }
  if (turno.estado === 'CANCELADO') {
    throw new Error('El turno ya esta cancelado');
  }
  if (turno.estado === 'FINALIZADO') {
    throw new Error('No se puede cancelar un turno finalizado');
  }

  const ahora = new Date();
  const fechaTurno = new Date(turno.fecha + 'T' + turno.horaInicio);
  const nuevoEstado = fechaTurno > ahora ? 'CANCELADO' : 'FINALIZADO';

  await turno.update({ estado: nuevoEstado });
  return turno;
};

const horariosDisponibles = async (fecha, servicioIds) => {
  if (!fecha) {
    throw new Error('Se requiere fecha');
  }

  if (!servicioIds || servicioIds.length === 0) {
    return BASE_SLOTS.map((s) => s.hora);
  }

  const ids = Array.isArray(servicioIds) ? servicioIds : [servicioIds];

  const fechaDate = new Date(fecha + 'T12:00:00');
  const diaSemana = fechaDate.getDay();
  if (diaSemana === 0) {
    return [];
  }

  const duracionTotal = await calcularDuracionTotal(ids);

  const turnos = await Turno.findAll({
    where: {
      fecha,
      estado: { [Op.ne]: 'CANCELADO' },
    },
    order: [['horaInicio', 'ASC']],
  });

  const ocupados = turnos.map((t) => ({
    inicio: horaEnMinutos(t.horaInicio),
    fin: horaEnMinutos(t.horaFin),
  }));

  const disponibles = BASE_SLOTS.filter((slot) => {
    const finSlot = slot.minutos + duracionTotal;
    const hayConflicto = ocupados.some(
      (o) => slot.minutos < o.fin && finSlot > o.inicio
    );
    return !hayConflicto && finSlot <= 22 * 60;
  });

  return disponibles.map((s) => s.hora);
};

module.exports = {
  crearTurno,
  listarTurnos,
  editarTurno,
  cancelarTurno,
  horariosDisponibles,
};
