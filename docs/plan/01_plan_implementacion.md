# Plan de Implementación Consolidado

Este plan detalla las tareas técnicas, arquitectura, estrategia de concurrencia y despliegue del trabajo sprint por sprint.

## 1. Arquitectura y Estrategias Críticas

### 1.1. Estrategia de Concurrencia de Reservas (HU-15)
El problema principal del proyecto es evitar el choque de horarios en reservas concurrentes. 
- **[RECOMENDADO] Estrategia en Base de Datos (PostgreSQL EXCLUDE Constraint):** Dado que Prisma no soporta `EXCLUDE` nativamente, crearemos una migración SQL manual vacía (`npx prisma migrate dev --create-only`) y añadiremos la restricción directamente en PostgreSQL usando el tipo `tstzrange` y `btree_gist`. Esto bloqueará a nivel de motor de BD cualquier registro que intente ocupar el mismo rango de horas en el mismo `laboratorio_id` si su estado es 'Pendiente' o 'Aprobada'.
- **Estrategia en Prisma (Transacciones):** Se usará `prisma.$transaction` con un nivel de aislamiento `Serializable` para leer las reservas existentes y crear la nueva. Si hay choque, la transacción falla.

### 1.2. Estrategia de Tareas Programadas (Cron Jobs)
Para cumplir con HU-11 (desbloqueo automático post-mantenimiento) y HU-24 (cancelación tras 15 min sin escaneo QR):
- **Herramienta:** Usaremos `node-cron`.
- **Implementación:** Un worker en el servidor NodeJS ejecutará un barrido cada 5 minutos sobre la tabla `reservas`, identificando aquellas en estado 'Confirmada', cuya `fechaInicio` pasó hace más de 15 mins y `horaAsistencia` es nulo, actualizando su estado a 'Inasistencia'.

### 1.3. Catálogo Uniforme de Endpoints (Ejemplos Base)
- `GET /api/v1/laboratorios` (Paginación: `?page=1&limit=15`, Filtros: `?capacidad=40`)
- `GET /api/v1/laboratorios/:id/calendario?fecha=2026-10-01`
- `POST /api/v1/reservas` (Body: `{ laboratorioId, fechaInicio, fechaFin, cantidadAlumnos }`)
- `PUT /api/v1/reservas/:id/estado` (Body: `{ estado: 'Confirmada' }`)
- `POST /api/v1/asistencia/escaneo` (Body: `{ tokenQr }`)

---

## 2. Plan por Sprints

### Sprint 1: Fundamentos, Seguridad y Catálogo (En progreso / Cierre)
*El backend ya cubre gran parte de esto, el trabajo real pendiente es Frontend y refactorización.*

| ID | Funcionalidad | Responsable | Estado | Pendiente Real |
| :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Registro/Login | Jose | Parcial | Construir UI (Pantallas Login/Registro en React), manejo de estado global de auth. |
| **HU-02** | Solicitar/Aprobar Rol | Equipo | No Iniciada| Endpoint `POST /solicitudes_rol`, UI para Admin de aprobación. |
| **HU-06** | Crear lab | Herlan | Parcial | Construir UI (Formulario React), validación de aforo > 0. |
| **HU-07** | Configurar horarios | Miguel | Parcial | UI para establecer horas, validaciones de choque en `hora_cierre`. |
| **HU-08** | Vincular equipo | Equipo | Parcial | UI modal para agregar hardware. |
| **HU-12** | Catálogo público | Marcos | Parcial | UI: Tarjetas en grid (15 por pág), estado vacío, diseño móvil (Tailwind). |
| **HU-13** | Calendario interactivo| Fernando | No Iniciada| Integración de librería (ej. `react-big-calendar`), endpoint `GET /reservas/calendario`. |
| **HU-14** | Filtrado avanzado | Andres | Parcial | UI de sidebar de filtros. Hook de React Query para refetch. |
| **HU-03** | Reset Password | Equipo | No Iniciada| Endpoint de olvido de pass, token JWT expirable (15m), UI. |

**Tareas Atómicas Frontend (Sprint 1):**
- [ ] Configurar Axios instanciado con interceptores (añadir header JWT automático).
- [ ] Construir layout general y Navbar (Tailwind).
- [ ] Construir pantalla `/login` y `/registro` (React Hook Form).
- [ ] Construir `/catalogo` con tarjetas y barra de filtros.
- [ ] Construir `/laboratorio/:id` con la vista de calendario y botones de semana siguiente/anterior.

### Sprint 2: Motor de Reservas y Validación Asistencia (Core)

| ID | Funcionalidad | Responsable | Dependencia | Riesgos |
| :--- | :--- | :--- | :--- | :--- |
| **HU-15** | Solicitud Reserva | [Sin asignar] | HU-13 | **Alto:** Colisión de transacciones. |
| **HU-16** | Bandeja Pendientes | [Sin asignar] | HU-15 | Medio: Paginación eficiente. |
| **HU-17** | Aprobar/Rechazar | [Sin asignar] | HU-16 | Alto: Generación segura de Token QR. |
| **HU-22** | Ver Código QR | [Sin asignar] | HU-17 | Medio: Renderizado móvil. |
| **HU-23** | Escaneo QR (Ingreso)| [Sin asignar] | HU-22 | Alto: Expiración y validación correcta. |
| **HU-25** | Auditoría Reservas | [Sin asignar] | HU-17 | Bajo. |
| **HU-09** | Modificar lab info | [Sin asignar] | HU-06 | Bajo. |
| **HU-20** | Notificaciones app | [Sin asignar] | HU-17 | Alto: Si se hace en vivo requiere Socket.io. |

**Trabajo en Base de Datos (HU-15):**
- [ ] Crear migración SQL cruda para restricción EXCLUDE USING gist en Postgres.
- [ ] Configurar índice único para el `tokenQr`.

**Trabajo Backend:**
- [ ] Endpoint `POST /reservas` con validación de horarios vs `horarios_laboratorio`.
- [ ] Endpoint `PUT /reservas/:id/estado` que inyecte un Hash seguro (ej. `crypto.randomBytes`) si el estado es 'Confirmada'.
- [ ] Endpoint `POST /asistencia/qr` que reciba el hash, busque la reserva hoy, y actualice `horaAsistencia = now()`.

**Trabajo Frontend:**
- [ ] Formulario de solicitud de reserva (prellenado al clickear en calendario).
- [ ] Bandeja tipo Kanban o Lista para el Responsable.
- [ ] Instalación de librería `qrcode.react` para mostrar el QR en móvil.
- [ ] Vista del Auxiliar con lector QR usando la cámara del celular (librería `html5-qrcode`).

### Sprint 3: Casos de Borde y Reportes

| ID | Funcionalidad | Responsable |
| :--- | :--- | :--- |
| **HU-11** | Reporte Mantenimiento | [Sin asignar] |
| **HU-10** | Estado op. equipo/lab | [Sin asignar] |
| **HU-18** | Cancelar propia | [Sin asignar] |
| **HU-19** | Cancelar fuerza mayor | [Sin asignar] |
| **HU-24** | Cancelación automática| [Sin asignar] |
| **HU-04** | Perfil (Foto/Telf) | [Sin asignar] |
| **HU-05** | Historial sesiones | [Sin asignar] |
| **HU-21** | Historial personal | [Sin asignar] |
| **HU-26** | Dashboard Estadísticas| [Sin asignar] |
| **HU-27** | Exportación Excel | [Sin asignar] |

**Implementación Tareas Programadas (HU-24):**
- [ ] Instalar `node-cron`. Crear script que haga un `UPDATE reservas SET estado='Inasistencia' WHERE estado='Confirmada' AND horaAsistencia IS NULL AND fechaInicio < NOW() - INTERVAL '15 minutes'`.

**Reportes (HU-26, HU-27):**
- [ ] Frontend: Usar `recharts` o `chart.js` para los gráficos de barra de horarios pico.
- [ ] Backend: Integrar `exceljs` para generar el buffer del archivo Excel y enviarlo como `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

---

## 3. Plan de Pruebas y Criterios DoD (Definition of Done)

Para que una HU sea considerada como "Terminada", debe cumplir:
1. Código integrado en rama `develop` (o main).
2. Endpoint documentado en Postman.
3. Tests correspondientes superados.

**Casos de Prueba Críticos (A automatizar/documentar):**
- **Test de Solapamiento (HU-15):** Lanzar 5 peticiones HTTP simultáneas (con `Promise.all` o `k6`) pidiendo el mismo laboratorio el Viernes 10:00 AM. **Resultado esperado:** 1 solicitud retorna código HTTP 201 (Creado), 4 solicitudes retornan código HTTP 409 (Conflicto).
- **Test de Escaneo QR (HU-23):** Intentar escanear un QR válido, luego intentar escanearlo por segunda vez. **Resultado esperado:** Primer intento 200 OK. Segundo intento 400 Bad Request ("Reserva ya validada").

## 4. Plan de Capacidad y Recortes
Si el equipo de 6 personas enfrenta retrasos críticos en el Sprint 3:
- **Prioridad de Recorte (Lo que se puede descartar sin arruinar el MVP):** HU-04 (Actualizar foto de perfil), HU-26 (Dashboard visual - sustituir por tabla simple), HU-05 (Historial de sesiones).
- **Innegociable (Core):** HU-15 (Reservas), HU-17 (Aprobación) y HU-23 (Escaneo QR).
