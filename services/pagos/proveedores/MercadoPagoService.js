const { MercadoPagoConfig, Preference } = require('mercadopago');
const PagoService = require('../PagoService');

class MercadoPagoService extends PagoService {
  constructor() {
    super();
    const tokenProd = process.env.MP_ACCESS_TOKEN;
    const tokenTest = process.env.MP_ACCESS_TOKEN_TEST;

    this.clientProd = tokenProd ? new MercadoPagoConfig({ accessToken: tokenProd }) : null;
    this.clientTest = tokenTest ? new MercadoPagoConfig({ accessToken: tokenTest }) : null;
  }

  async createPreference(pedido, detalles, buyer) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const modoLocal = !frontendUrl.startsWith('https');

    const client = modoLocal ? this.clientTest : this.clientProd;
    if (!client) {
      const msg = modoLocal
        ? 'Falta MP_ACCESS_TOKEN_TEST para el entorno local'
        : 'Falta MP_ACCESS_TOKEN para produccion';
      throw new Error(msg);
    }

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

    if (modoLocal) {
      body.purpose = 'wallet_purchase';
    } else {
      body.auto_return = 'approved';
    }

    const preference = new Preference(client);
    const result = await preference.create({ body });

    return {
      preferenceId: result.id,
      initPoint: modoLocal ? result.sandbox_init_point : result.init_point,
    };
  }

  async verifyPayment(paymentId) {
    const client = this.clientProd || this.clientTest;
    if (!client) {
      throw new Error('Mercado Pago no configurado.');
    }

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
    };
  }
}

module.exports = MercadoPagoService;
