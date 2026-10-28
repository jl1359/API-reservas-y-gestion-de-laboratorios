'use strict';
const path=require('node:path');
const os=require('node:os');
const qa=async function qaRunner(project, output) {
  const fs = require('node:fs');
  const path = require('node:path');
  const assert = require('node:assert/strict');
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'labreserve-qa-local-sin-cuentas-reales';
  process.env.DATABASE_URL = 'postgresql://qa:qa@127.0.0.1:6543/qa_local?connect_timeout=1';
  process.env.CLIENT_URL = 'https://qa-autorizado.example';
  const backend = path.join(project, 'backend');
  const authService = require(path.join(backend, 'dist/services/auth.service.js'));
  const originalReset = authService.resetPasswordService;
  const { prisma } = require(path.join(backend, 'dist/config/prisma.js'));
  let called = 0;
  // Se simula solamente la persistencia del restablecimiento; no se prueba una contraseña real.
  authService.resetPasswordService = async (token, password) => {
    assert.equal(token, 'token-exclusivo-de-prueba-local');
    assert.equal(password, 'Testing123!');
    called += 1;
    return { mensaje: 'Contrato HTTP validado con servicio simulado' };
  };
  const app = require(path.join(backend, 'dist/app.js')).default;
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.once('error', reject);
  });
  const base = 'http://127.0.0.1:'+server.address().port;
  const results = [];
  async function request(url, body, headers = {}) {
    const response = await fetch(base+url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(7000)
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, headers: response.headers, data };
  }
  async function test(id, nombre, action, parcial = false) {
    try {
      const detail = await action();
      results.push({ id, prueba: nombre, resultado: parcial ? 'Parcial' : 'Conforme', detalle: detail });
    } catch (e) {
      results.push({ id, prueba: nombre, resultado: 'Falló', detalle: String(e.message || e) });
    }
  }
  try {
    const codes = [
      ['T01','Estado de la API','/api/health',undefined,200],
      ['T02','Inicio de sesión vacío','/api/auth/login',{},400],
      ['T03','Correo numérico en login','/api/auth/login',{correo:42,password:'Testing123!'},400],
      ['T04','Registro vacío','/api/auth/register',{},400],
      ['T05','Recuperación sin correo','/api/auth/forgot-password',{},400],
      ['T06','Reporte de asistencias sin token','/api/reportes/asistencias?fecha=2026-10-28',undefined,401],
      ['T07','Reporte con token inválido','/api/reportes/asistencias?fecha=2026-10-28',undefined,401,{Authorization:'Bearer invalido'}],
      ['T08','Usuarios sin token','/api/usuarios',undefined,401],
      ['T09','Reservas sin token','/api/reservas',undefined,401]
    ];
    for (const [id,name,url,body,expected,headers] of codes) {
      await test(id,name,async()=>{const r=await request(url,body,headers);assert.equal(r.status,expected);return {http:r.status};});
    }
    await test('T10','Restablecimiento: contrato del formulario y controlador (servicio simulado)',async()=>{
      const source=fs.readFileSync(path.join(project,'frontend/src/pages/ResetPassword.tsx'),'utf8');
      assert.match(source,/newPassword\s*:\s*nuevaContrasena/);
      const r=await request('/api/auth/reset-password',{token:'token-exclusivo-de-prueba-local',newPassword:'Testing123!'});
      assert.equal(r.status,200);assert.equal(called,1);
      return {http:r.status,alcance:'Paso de campos hasta un servicio simulado; sin JWT real, correo ni PostgreSQL'};
    });
    await test('T11','Restablecimiento: rechazo de cuerpo con campo incorrecto',async()=>{
      const callsBefore=called;
      const r=await request('/api/auth/reset-password',{token:'token-exclusivo-de-prueba-local',nuevaContrasena:'Testing123!'});
      assert.equal(r.status,400);assert.equal(called,callsBefore);return {http:r.status};
    });
    await test('T12','CORS permite el origen configurado',async()=>{
      const r=await request('/api/health',undefined,{Origin:'https://qa-autorizado.example'});
      assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'https://qa-autorizado.example');
      return {http:r.status,origenPermitido:r.headers.get('access-control-allow-origin')};
    });
    await test('T13','CORS no autoriza un origen ajeno',async()=>{
      const r=await request('/api/health',undefined,{Origin:'https://qa-noautorizado.example'});
      assert.equal(r.status,200);
      assert.equal(r.headers.get('access-control-allow-origin'),null);
      return {http:r.status,origenPermitido:null};
    });
    await test('T14','Cabeceras de protección de la API',async()=>{
      const r=await request('/api/health');assert.equal(r.headers.get('x-frame-options'),'DENY');assert.equal(r.headers.get('x-content-type-options'),'nosniff');
      return {frameOptions:'DENY',contentTypeOptions:'nosniff'};
    });
    await test('T15','Limitador presente; criterio de cinco fallos pendiente',async()=>{
      let r;
      for(let i=0;i<18;i++){r=await request('/api/auth/login',{});if(r.status===429)break;}
      assert.equal(r.status,429);assert.ok(Number(r.headers.get('retry-after'))>0);
      return {http:r.status,reintentarEnSegundos:Number(r.headers.get('retry-after')),pendiente:'Confirmar requisito vigente y probar cinco contraseñas fallidas con una cuenta real'};
    },true);
  } finally {
    authService.resetPasswordService = originalReset;
    await prisma.$disconnect();
    await new Promise(resolve=>server.close(resolve));
  }
  const result={fecha:new Date().toISOString(),node:process.version,sistema:process.platform,alcance:'Pruebas locales anteriores a la persistencia. Restablecimiento con servicio simulado. Sin cuentas, correos, reservas ni QR reales.',total:results.length,conformes:results.filter(x=>x.resultado==='Conforme').length,parciales:results.filter(x=>x.resultado==='Parcial').length,fallos:results.filter(x=>x.resultado==='Falló').length,pruebas:results};
  fs.writeFileSync(output,JSON.stringify(result,null,2),'utf8');
  for(const r of results)console.log(`${r.id} ${r.resultado}: ${r.prueba}`);
  console.log(`\nResultado: ${result.conformes} conformes, ${result.parciales} parcial(es), ${result.fallos} fallo(s).`);
  return result;
};
qa(path.resolve(__dirname,'../..'),process.argv[2]||path.join(os.tmpdir(),'labreserve-qa-'+Date.now()+'.json')).then(r=>{process.exitCode=r.fallos?1:0;}).catch(e=>{console.error(e);process.exitCode=1;});
