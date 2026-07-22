const MercadoPagoService = require('./proveedores/MercadoPagoService');

let proveedorActivo = null;

function getProveedorPago() {
  if (!proveedorActivo) {
    const proveedor = process.env.PROVEEDOR_PAGO || 'mercadopago';

    switch (proveedor) {
      case 'mercadopago':
        proveedorActivo = new MercadoPagoService();
        break;
      default:
        throw new Error(`Proveedor de pago desconocido: ${proveedor}`);
    }
  }
  return proveedorActivo;
}

module.exports = { getProveedorPago };
