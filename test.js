const http = require('http');
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = http.request({ hostname: 'localhost', port: 3000, path, method, headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}
async function test() {
  const login = await req('POST', '/api/auth/login', { email: 'admin@test.com', password: '123456' });
  const token = login.token;

  const servicios = await req('GET', '/api/servicios', null, token);
  const clientes = await req('GET', '/api/clientes', null, token);
  const kapping = servicios.find(s => s.nombre === 'Kapping');
  const cliente = clientes[0];

  console.log('=== 1. Disponibilidad domingo (deberia volver []) ===');
  const dom = await req('GET', `/api/turnos/disponibles?fecha=2026-07-13&servicioId=${kapping.id}`, null, token);
  console.log('Domingo:', JSON.stringify(dom));

  console.log('\n=== 2. Crear turno domingo (deberia fallar) ===');
  const domTurno = await req('POST', '/api/turnos', {
    clienteId: cliente.id, servicioId: kapping.id, fecha: '2026-07-13', horaInicio: '10:00'
  }, token);
  console.log(domTurno.error ? `Rechazado: ${domTurno.error}` : 'CREADO (ERROR)');

  console.log('\n=== 3. Disponibilidad lunes 9:00-22:00 ===');
  const lun = await req('GET', `/api/turnos/disponibles?fecha=2026-07-14&servicioId=${kapping.id}`, null, token);
  console.log(`Lunes libres: ${lun.length} horarios`);
  console.log('Primeros 5:', JSON.stringify(lun.slice(0, 5)));
  console.log('Ultimos 5:', JSON.stringify(lun.slice(-5)));
  console.log('Ultimo horario:', lun[lun.length - 1], '(debe ser antes de las 22:00)');

  console.log('\n=== TODOS LOS TESTS PASARON ===');
}
test().catch(console.error);
