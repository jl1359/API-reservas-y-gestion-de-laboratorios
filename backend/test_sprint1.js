
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("--- INICIANDO PRUEBAS AUTOMATIZADAS DEL SPRINT 1 ---");
  const baseUrl = "http://localhost:3000/api";
  let token = "";
  let labId = 0;

  try {
    console.log("\n[1] Probando: POST /auth/register (HU-01)");
    const resReg = await fetch(baseUrl + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreCompleto: "Admin Test", correo: "admin.test@gmail.com", password: "password123" })
    });
    console.log("Respuesta:", resReg.status, await resReg.json());

    console.log("\n[2] Simulando Verificacion de Correo y Ascenso a Admin...");
    const adminRol = await prisma.rol.findFirst({ where: { nombre: "Admin" } });
    await prisma.usuario.update({
      where: { correo: "admin.test@gmail.com" },
      data: { correoVerificado: true, rolId: adminRol.id }
    });
    console.log("OK: Usuario es ahora Admin y esta verificado.");

    console.log("\n[3] Probando: POST /auth/login (HU-01)");
    const resLogin = await fetch(baseUrl + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "admin.test@gmail.com", password: "password123" })
    });
    const loginData = await resLogin.json();
    console.log("Respuesta:", resLogin.status, "Token obtenido:", loginData.token ? "SI" : "NO");
    token = loginData.token;

    console.log("\n[4] Probando: POST /laboratorios (HU-06)");
    const carrera = await prisma.carrera.findFirst();
    const resLab = await fetch(baseUrl + "/laboratorios", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ nombre: "Laboratorio de Pruebas", capacidad: 20, ubicacion: "Edificio A", carreraId: carrera.id })
    });
    const labData = await resLab.json();
    console.log("Respuesta:", resLab.status, labData);
    labId = labData.id;

    console.log("\n[5] Probando: POST /equipamientos/laboratorio/:id (HU-08)");
    const equipo = await prisma.equipamiento.findFirst();
    if(equipo) {
      const resEq = await fetch(baseUrl + "/equipamientos/laboratorio/" + labId, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ equipamientoId: equipo.id, cantidad: 15 })
      });
      console.log("Respuesta:", resEq.status, await resEq.json());
    }

    console.log("\n[6] Probando: POST /laboratorios/:id/horarios (HU-07)");
    const resHor = await fetch(baseUrl + "/laboratorios/" + labId + "/horarios", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ horarios: [{ dia: "Lunes", horaApertura: "08:00", horaCierre: "14:00" }] })
    });
    console.log("Respuesta:", resHor.status, await resHor.json());

    console.log("\n[7] Probando: GET /laboratorios (HU-12)");
    const resCat = await fetch(baseUrl + "/laboratorios");
    const catData = await resCat.json();
    console.log("Respuesta:", resCat.status, "Laboratorios encontrados:", catData.length);

    console.log("\n[8] Probando: GET /laboratorios/:id/calendario (HU-13)");
    const resCal = await fetch(baseUrl + "/laboratorios/" + labId + "/calendario", {
      headers: { "Authorization": "Bearer " + token }
    });
    console.log("Respuesta:", resCal.status, await resCal.json());

  } catch (err) {
    console.error("Error en las pruebas:", err);
  } finally {
    console.log("\n--- LIMPIANDO DATOS DE PRUEBA ---");
    if (labId) await prisma.laboratorio.delete({ where: { id: labId } }).catch(()=>{});
    await prisma.usuario.delete({ where: { correo: "admin.test@gmail.com" } }).catch(()=>{});
    console.log("Base de datos limpia.");
    await prisma.$disconnect();
  }
}
runTests();
