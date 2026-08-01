const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const OWNER = process.env.WHATSAPP_OWNER || '';
const GRAPH_URL = 'https://graph.facebook.com/v25.0';

async function enviarMensaje(telefono, mensaje) {
  if (!TOKEN || !PHONE_ID) {
    console.warn('WhatsApp Cloud API no configurado (WHATSAPP_TOKEN/WHATSAPP_PHONE_ID).');
    return null;
  }
  if (!telefono) {
    console.warn('Telefono destino vacio, se omite el mensaje.');
    return null;
  }

  try {
    const res = await fetch(`${GRAPH_URL}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'text',
        text: { body: mensaje },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        'Error enviando WhatsApp:',
        res.status,
        JSON.stringify(data).slice(0, 400)
      );
      return null;
    }

    console.log(`WhatsApp enviado a ${telefono}:`, data?.messages?.[0]?.id || 'ok');
    return data;
  } catch (error) {
    console.error('Error en whatsapp.service:', error.message);
    return null;
  }
}

function notificarNuevaReserva(turno, servicios, montoSenia) {
  const nombres = servicios.map((s) => s.nombre).join(' + ');
  const fecha = new Date(turno.fecha + 'T12:00:00');
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const fechaLarga = `${dias[fecha.getDay()]} ${fecha.getDate()}/${fecha.getMonth() + 1}`;

  const msg = [
    'NUEVA RESERVA ONLINE',
    '------------------------',
    `Cliente: ${turno.clienteNombre || 'Sin nombre'}`,
    `Telefono: ${turno.clienteWhatsApp || '-'}`,
    `Servicio(s): ${nombres}`,
    `Fecha: ${fechaLarga}`,
    `Hora: ${turno.horaInicio.slice(0, 5)} - ${turno.horaFin.slice(0, 5)}`,
    `Seña (50%): $${Number(montoSenia).toLocaleString('es-AR')}`,
    `Estado: ${turno.estado}`,
    turno.observaciones ? `Observaciones: ${turno.observaciones}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return enviarMensaje(OWNER, msg);
}

module.exports = {
  enviarMensaje,
  notificarNuevaReserva,
};
