class PagoService {
  async createPreference(pedido, detalles, buyer) {
    throw new Error('Metodo createPreference no implementado');
  }

  async verifyPayment(paymentId) {
    throw new Error('Metodo verifyPayment no implementado');
  }
}

module.exports = PagoService;
