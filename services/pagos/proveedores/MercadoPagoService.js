const { MercadoPagoConfig, Preference } = require('mercadopago');
const PagoService = require('../PagoService');
const { obtenerCredencialActiva } = require('../../mp-oauth.service');

class MercadoPagoService extends PagoService {
  constructor() {
    super();
    this.accessTokenEnv = process.env.MP_ACCESS_TOKEN;
    if (!this.accessTokenEnv) {
      console.warn('MP_ACCESS_TOKEN no configurado (se usara OAuth si esta conectado).');
    }
  }

  async obtenerCliente() {
    let accessToken = null;

    try {
      const credencial = await obtenerCredencialActiva();
      if (credencial?.accessToken) {
        accessToken = credencial.accessToken;
      }
    } catch (error) {
      console.warn('No se pudo leer credencial OAuth de la base:', error.message);
    }

    if (!accessToken) {
      accessToken = this.accessTokenEnv;
    }

    if (!accessToken) {
      throw new Error('Mercado Pago no configurado. Conecta tu cuenta en el admin.');
    }

    return new MercadoPagoConfig({ accessToken });
  }

  async createPreference(pedido, detalles, buyer) {
    const client = await this.obtenerCliente();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    const body = {
      items: detalles.map((d) => ({
        id: d.productoId,
        title: d.nombre || 'Producto',
        description: d.descripcion || '',
        quantity: d.cantidad,
        unit_price: Number(d.precio),
        currency_id: 'ARS',
      })),
      payer: {
        name: buyer.nombre || '',
        email: buyer.email || '',
      },
      back_urls: {
        success: `${frontendUrl}/pedido/${pedido.id}/exito`,
        failure: `${frontendUrl}/pedido/${pedido.id}/fracaso`,
        pending: `${frontendUrl}/pedido/${pedido.id}/pendiente`,
      },
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
      external_reference: pedido.id,
      auto_return: 'approved',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
    };
  }

  async verifyPayment(paymentId) {
    const client = await this.obtenerCliente();

    const { Payment } = require('mercadopago');
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    return {
      status: result.status,
      statusDetail: result.status_detail,
      paymentMethodId: result.payment_method_id,
      paymentTypeId: result.payment_type_id,
      transactionAmount: result.transaction_amount,
      payerEmail: result.payer?.email,
      externalReference: result.external_reference,
      preferenceId: result.preference_id,
      userId: result.user_id,
    };
  }

  async createTurnoPreference(turno, servicios, montoSenia, buyer) {
    const client = await this.obtenerCliente();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    const nombres = servicios.map((s) => s.nombre).join(' + ');

    const body = {
      items: [
        {
          id: turno.id,
          title: `Seña (50%) - ${nombres}`,
          description: `Reserva ${turno.fecha} ${turno.horaInicio.slice(0, 5)} - ${turno.horaFin.slice(0, 5)}`,
          quantity: 1,
          unit_price: Number(montoSenia),
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: buyer.nombre || '',
        email: buyer.email || '',
      },
      back_urls: {
        success: `${frontendUrl}/reservar/${turno.id}/resultado/exito`,
        failure: `${frontendUrl}/reservar/${turno.id}/resultado/fracaso`,
        pending: `${frontendUrl}/reservar/${turno.id}/resultado/pendiente`,
      },
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
      external_reference: `TURNO-${turno.id}`,
      auto_return: 'approved',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
    };
  }
}

module.exports = MercadoPagoService;
