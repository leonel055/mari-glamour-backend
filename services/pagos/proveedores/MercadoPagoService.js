const { MercadoPagoConfig, Preference } = require('mercadopago');
const PagoService = require('../PagoService');

class MercadoPagoService extends PagoService {
  constructor() {
    super();
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn('MP_ACCESS_TOKEN no configurado. Mercado Pago deshabilitado.');
    }
    this.client = accessToken
      ? new MercadoPagoConfig({ accessToken })
      : null;
    this.esProduccion = accessToken?.startsWith('APP_USR') ?? false;
  }

  async createPreference(pedido, detalles, buyer) {
    if (!this.client) {
      throw new Error('Mercado Pago no configurado. Falta MP_ACCESS_TOKEN.');
    }

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
        phone: buyer.telefono ? { number: buyer.telefono } : undefined,
      },
      back_urls: {
        success: `${frontendUrl}/pedido/${pedido.id}/exito`,
        failure: `${frontendUrl}/pedido/${pedido.id}/fracaso`,
        pending: `${frontendUrl}/pedido/${pedido.id}/pendiente`,
      },
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
      external_reference: pedido.id,
    };

    const frontendSsl = frontendUrl.startsWith('https');
    if (this.esProduccion && frontendSsl) {
      body.auto_return = 'approved';
    }

    const preference = new Preference(this.client);
    const result = await preference.create({ body });

    return {
      preferenceId: result.id,
      initPoint: this.esProduccion ? result.init_point : result.sandbox_init_point,
    };
  }

  async verifyPayment(paymentId) {
    if (!this.client) {
      throw new Error('Mercado Pago no configurado. Falta MP_ACCESS_TOKEN.');
    }

    const { Payment } = require('mercadopago');
    const payment = new Payment(this.client);
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
    };
  }
}

module.exports = MercadoPagoService;
