# Documentación Técnica de Historias de Usuario — Sprint 2

> **Periodo:** Semanas 3 y 4 (13/10/2026 – 26/10/2026)  
> **Objetivo del Sprint:** Desarrollar el núcleo transaccional del sistema: motor de reservas con prevención matemática de colisiones concurrentes mediante PostgreSQL EXCLUDE, flujo de aprobación, generación y escaneo seguro de códigos QR, y gestión de notificaciones RESTful.  
> **Puntos de Historia Totales:** 35 pts.

---

<a id="hu-15"></a>
## HU-15: Solicitud de Reserva de Laboratorio (Motor de Concurrencia)
- **Épica:** Reservas (CORE DEL PROYECTO)
- **Responsables:** Miguel Rodriguez Peña y José Luis Canaviri Lopez
- **Estimación:** 8 puntos
- **Nivel Bloom:** **Evaluar** (Diseño y validación experimental del comportamiento transaccional ante solicitudes concurrentes simultáneas, contrastando bloqueos lógicos vs restricciones de motor).
- **Estado Actual:** Diseñado en plan arquitectónico; pendiente migración SQL manual de `EXCLUDE` y controlador transaccional.

### 1. Criterios de Aceptación
1. **Envío de Solicitud:** Un usuario con rol `Docente` o `Auxiliar` envía una solicitud con `laboratorioId`, `fechaInicio`, `fechaFin`, `materia`, `cantidadAlumnos` y opcionalmente `numeroComputadora`.
2. **Bloqueo Inmediato:** El registro se crea en estado `Pendiente`. Mientras permanezca en `Pendiente` o `Confirmada`, **ningún otro usuario** puede reservar ni solicitar ese mismo bloque horario.
3. **Control Concurrente en Base de Datos:** Si dos o más solicitudes simultáneas compiten por el mismo horario (mismo milisegundo), la restricción de exclusión de PostgreSQL (`EXCLUDE USING gist`) acepta estrictamente una y rechaza las demás con el error PostgreSQL `23P01` (exclusion_violation), que el backend traduce a **HTTP 409 Conflict**.
4. **Validación de Capacidad:** Si `cantidadAlumnos > laboratorio.capacidad`, el formulario frontend desactiva el botón y la API rechaza con HTTP 400.
5. **Validación de Horario Operativo:** La reserva debe iniciar y terminar estrictamente dentro del rango de apertura del laboratorio (`horarios_laboratorio`) para ese día y no coincidir con feriados.
6. **Recurrencia Semestral:** Si el docente marca "Repetir todo el semestre", el backend genera la serie en una **sola transacción atómica**. Si alguna de las semanas presenta conflicto con otra reserva existente o feriado, la transacción se aborta por completo y devuelve la lista de semanas en conflicto (HTTP 409 con detalles).

### 2. Especificación Técnica
- **Restricción PostgreSQL (Migración SQL Cruda):**
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;

  ALTER TABLE reservas
    ADD CONSTRAINT reservas_sin_solapamiento
    EXCLUDE USING gist (
      laboratorio_id WITH =,
      COALESCE(numero_computadora, 0) WITH =,
      tstzrange(fecha_inicio, fecha_fin, '[)') WITH &&
    ) WHERE (estado IN ('Pendiente', 'Confirmada'));

  ALTER TABLE reservas
    ADD CONSTRAINT reservas_rango_valido
    CHECK (fecha_fin > fecha_inicio);
  ```
- **Endpoints:**
  - `POST /api/reservas` (Docente/Auxiliar/Admin)
    - Body: `{ laboratorioId: number, fechaInicio: ISOString, fechaFin: ISOString, materia: string, cantidadAlumnos: number, numeroComputadora?: number, recurrente?: boolean, fechaFinSemestre?: ISOString }`
    - Respuestas: `201 Created { id, estado: 'Pendiente' }` | `400 Bad Request` | `409 Conflict { code: 'RESERVA_SOLAPADA', message: 'El horario solicitado entra en colisión con otra reserva activa' }`
- **Frontend:**
  - `features/reservas/SolicitudReservaForm.tsx`: Autocompletado tras clic en el calendario, validación de cupo máximo reactiva, selector de recurrencia.

### 3. Estrategia y Evidencia de Pruebas
- **Prueba de Concurrencia Automatizada (`reservas_concurrency.test.ts`):**
  - Utilizando `Promise.all()`, se disparan 5 peticiones simultáneas sobre el mismo `laboratorio_id` en la misma fecha y hora.
  - **Resultado Esperado y Verificado:** 1 petición responde con status `201` y las otras 4 peticiones responden con status `409`. En la base de datos se comprueba que existe exactamente 1 registro.

---

<a id="hu-16"></a>
## HU-16: Bandeja de Solicitudes Pendientes
- **Épica:** Reservas
- **Responsable:** Herlan Ibañez Condori
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Analizar** (Consultas paginadas y filtradas por laboratorio asignado al responsable).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Acceso Autorizado:** Solo usuarios con rol `Responsable de Laboratorio` y `Administrador` pueden acceder a la bandeja.
2. **Orden Cronológico:** La lista presenta primero las solicitudes con `fechaInicio` más próxima.
3. **Filtro por Laboratorio:** Selector desplegable para aislar solicitudes de un laboratorio concreto.
4. **Paginación:** Máximo de 15 solicitudes por página.
5. **Modal de Detalle:** Visualización de justificación del docente, asignatura y número de personas antes de tomar una decisión.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/reservas/pendientes?laboratorioId=&page=1&limit=15` (Solo Responsable/Admin) -> `200 OK { data: [...], meta: {...} }`
- **Frontend:**
  - `features/gestion/BandejaPendientesPage.tsx` con acciones rápidas de "Aprobar" o "Rechazar".

---

<a id="hu-17"></a>
## HU-17: Aprobación o Rechazo de Reserva
- **Épica:** Reservas
- **Responsable:** Herlan Ibañez Condori
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Crear** (Transición de estados de negocio, emisión criptográfica de tokens y sincronización de eventos de notificación).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Aprobación Exitosa:** Al aprobar, la reserva pasa a estado `Confirmada` y el sistema genera un `tokenQr` criptográfico aleatorio de alta entropía (256 bits, `crypto.randomBytes(32).toString('base64url')`).
2. **Re-verificación de Seguridad:** Si entre el momento de solicitud y el de aprobación se registró un mantenimiento imprevisto o el laboratorio fue inactivado, el sistema bloquea la aprobación y alerta al responsable.
3. **Rechazo con Justificación:** Para rechazar una reserva, es **obligatorio** ingresar un motivo textual (`motivoRechazo`). La reserva pasa a `Rechazada` y el horario queda inmediatamente liberado para nuevas solicitudes.
4. **Aprobación de Series:** Si la reserva forma parte de una serie semestral recurrente (`serieId`), el modal permite aprobar toda la serie en una única operación.
5. **Confirmación Previa:** Diálogo modal que previene clics accidentales de rechazo.

### 2. Especificación Técnica
- **Endpoints:**
  - `PUT /api/reservas/:id/gestionar` (Solo Responsable/Admin)
    - Body: `{ accion: 'Aprobar' | 'Rechazar', motivoRechazo?: string, aprobarSerie?: boolean }`
    - Respuestas: `200 OK` | `400 Bad Request` | `422 Unprocessable Entity`
- **Integración:** Registra automáticamente el evento en la tabla `notificaciones` y despacha correo informativo al docente solicitante.

---

<a id="hu-22"></a>
## HU-22: Visualización de Código QR de Ingreso
- **Épica:** Asistencia (QR)
- **Responsable:** Fernando Vera Vera
- **Estimación:** 4 puntos
- **Nivel Bloom:** **Aplicar** (Renderizado dinámico de códigos QR vectoriales en clientes web y móviles).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Reserva Confirmada:** El docente titular de la reserva puede visualizar el código QR exclusivamente si la reserva está en estado `Confirmada`.
2. **Ventana de Visualización:** El código QR se muestra con indicación visual de vigencia (válido desde 15 minutos antes hasta 15 minutos después de la hora de inicio).
3. **Privacidad:** Usuarios ajenos a la reserva no pueden acceder al QR ni a su token (HTTP 403 Forbidden).
4. **Adaptabilidad Móvil:** El QR se dibuja con tamaño adaptable a la pantalla del smartphone para garantizar lectura óptica inmediata con cámara.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/reservas/:id/qr` (Autenticado - Titular o Admin) -> `200 OK { tokenQr: string, expiraEn: ISOString }`
- **Frontend:**
  - Componente `features/reservas/ReservaQRModal.tsx` empleando la librería `qrcode.react` en formato SVG de alta nitidez.

---

<a id="hu-23"></a>
## HU-23: Escaneo y Validación de Código QR (Check-in en Puerta)
- **Épica:** Asistencia (QR)
- **Responsable:** Fernando Vera Vera
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Evaluar** (Validación de reglas temporales, no-repudio e idempotencia transaccional del escaneo físico).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Escaneo Óptico:** El Auxiliar o Responsable apunta la cámara del móvil al código QR del docente usando la interfaz web.
2. **Validación Atómica y de Un Solo Uso:** Si el token existe, la reserva está `Confirmada`, `horaAsistencia` es nulo y la hora actual está dentro de la ventana de validez (+/- 15 min):
   - Se actualiza `horaAsistencia = now()` y `estado = 'Asistida'`.
   - La pantalla del escáner se tiñe de **Verde**, mostrando confirmación con materia, nombre del docente y hora exacta.
3. **Detección de Re-escaneo:** Si se intenta escanear el mismo código QR por segunda vez, el sistema responde HTTP 409 Conflict ("Asistencia ya registrada previamente a las HH:mm:ss"). Pantalla **Amarilla/Roja**.
4. **Detección de Expiración:** Si el código se escanea fuera de la ventana permitida, responde HTTP 410 Gone ("Código QR expirado").
5. **Permisos:** Solo roles `Auxiliar`, `Responsable de Laboratorio` y `Administrador` tienen permitido el escaneo.

### 2. Especificación Técnica
- **Sentencia SQL Atómica (Sin condición de carrera):**
  ```sql
  UPDATE reservas 
  SET hora_asistencia = NOW(), estado = 'Asistida'
  WHERE token_qr = $1 
    AND estado = 'Confirmada' 
    AND hora_asistencia IS NULL;
  ```
- **Endpoints:**
  - `POST /api/asistencia/escanear` (Auxiliar/Resp/Admin) -> Body: `{ tokenQr: string }` -> `200 OK { mensaje: 'Asistencia registrada', reserva: {...} }` | `400` | `409` | `410`
- **Frontend:**
  - `features/asistencia/EscanerQRPage.tsx` utilizando `html5-qrcode` con carga diferida (`React.lazy`).

---

<a id="hu-25"></a>
## HU-25: Auditoría General de Reservas
- **Épica:** Reportes
- **Responsable:** Andrés Montaño Frias
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Analizar** (Trazabilidad y consulta histórica con filtros agregados).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Visibilidad:** El Responsable y el Administrador consultan el historial consolidado de todas las reservas: Asistidas, Canceladas, Rechazadas e Inasistencias.
2. **Filtro de Inasistencias:** Opción rápida para auditar reservas abandonadas (no-show).
3. **Inmutabilidad:** La vista no permite edición ni borrado de registros de auditoría.

### 2. Especificación Técnica
- **Endpoints:** `GET /api/reportes/auditoria-reservas?estado=&laboratorioId=&desde=&hasta=` (Solo Resp/Admin) -> `200 OK`

---

<a id="hu-09"></a>
## HU-09: Modificación de Información del Laboratorio
- **Épica:** Laboratorios
- **Responsable:** Marco Callisaya Chirinos
- **Estimación:** 4 puntos
- **Nivel Bloom:** **Aplicar** (Actualizaciones de entidades asegurando integridad de claves foráneas restrictivas).
- **Estado Actual:** Backend básico existente en `laboratorios.controller.ts`.

### 1. Criterios de Aceptación
1. **Actualización Segura:** El Administrador puede modificar capacidad, nombre, ubicación y carreras.
2. **Protección de Reservas Futuras:** Las modificaciones no alteran ni desvinculan las reservas futuras ya confirmadas (la relación `Usuario` y `Laboratorio` en Prisma tiene `onDelete: Restrict`).
3. **No Duplicidad:** Validar que el nuevo nombre no colisione con otro laboratorio registrado.

### 2. Especificación Técnica
- **Endpoints:** `PUT /api/laboratorios/:id` (Solo Admin) -> Body: `{ nombre?, capacidad?, ubicacion?, estadoOperativo? }` -> `200 OK`

---

<a id="hu-20"></a>
## HU-20: Consulta y Gestión RESTful de Notificaciones de Estado
- **Épica:** Reservas
- **Responsable:** Andrés Montaño Frias
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Aplicar** (Diseño e implementación de endpoints RESTful para la consulta paginada y actualización de estado de avisos al usuario).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Registro Persistente:** Cuando el estado de una reserva cambia (aprobada, rechazada o cancelada), el sistema genera un registro persistente en la tabla `notificaciones`.
2. **Campana de Interfaz:** El icono de campana en el Navbar consulta periódicamente la API (`GET /api/notificaciones/resumen`) y muestra un badge numérico con la cantidad de notificaciones no leídas.
3. **Consulta Paginada:** El endpoint `GET /api/notificaciones` devuelve la lista de notificaciones del usuario ordenadas cronológicamente, con soporte para filtrar por `leida=false`.
4. **Marcado de Leído:** Al hacer clic en una notificación, se ejecuta una petición `PATCH /api/notificaciones/:id/leer` que actualiza `leida = true` y decrementa el contador.

### 2. Especificación Técnica
- **Endpoints REST:**
  - `GET /api/notificaciones` (Autenticado) -> `200 OK { total, data: [...] }`
  - `GET /api/notificaciones/resumen` (Autenticado) -> `200 OK { noLeidas: number }`
  - `PATCH /api/notificaciones/:id/leer` (Autenticado) -> `200 OK`

---

<a id="hu-29"></a>
## HU-29: Configurar Días Feriados y Bloqueados
- **Épica:** Calendario / Administración
- **Responsable:** Miguel Rodriguez Peña
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Aplicar** (Persistencia, validación temporal preventiva y anulación reactiva de restricciones de calendario).
- **Estado Actual:** **Completada e Integrada al 100%**.

### 1. Definición y Criterios de Aceptación
> **Como** Administrador,  
> **Quiero** configurar fechas de feriados y días bloqueados en el calendario institucional,  
> **Para** evitar que docentes o estudiantes reserven laboratorios en días que la facultad estará cerrada.

1. **Adición de Fechas Restrictivas:**  
   Dado que el Administrador necesita inhabilitar un día por motivos institucionales (ej. Aniversario de Facultad o Día del Estudiante), cuando accede a la gestión de feriados y registra la fecha exacta junto a un motivo, entonces el sistema valida la entrada con Zod e inserta este bloqueo permanente en la tabla `feriados` de la base de datos maestra.
2. **Bloqueo Absoluto en el Motor de Reservas y Frontend:**  
   Dado que un feriado oficial ha sido configurado en el sistema, cuando cualquier usuario cargue los calendarios o formularios para hacer una solicitud, entonces la plataforma sombrea la fecha, muestra una alerta visual institucional y desactiva el botón de envío. Si se intenta una petición directa vía API, el backend rechaza con **HTTP 409 Conflict** (`code: 'FERIADO_BLOQUEADO'`).
3. **Anulación de Restricción (Reapertura Inmediata):**  
   Dado que la facultad revoca la suspensión de actividades y el feriado se cancela, cuando el Administrador elimina ese registro de su panel, entonces el sistema reabre inmediatamente ese día en todos los calendarios y el motor de reservas vuelve a admitir solicitudes con HTTP 201 Created.

### 2. Especificación Técnica
- **Endpoints REST:**
  - `GET /api/feriados` (Público/Autenticado) -> `200 OK { total, data: [...] }`
  - `POST /api/feriados` (Solo Admin) -> Body: `{ fecha: 'YYYY-MM-DD', motivo: string, bloqueoActivo?: boolean }` -> `201 Created` | `400` | `409`
  - `DELETE /api/feriados/:id` (Solo Admin) -> `200 OK { success: true, mensaje: '...' }`
  - `PATCH /api/feriados/:id/toggle` (Solo Admin) -> `200 OK`
- **Frontend:**
  - `AdminDashboard.tsx`: Pestaña dedicada "Feriados y Bloqueos" con tabla de gestión y modal de creación/eliminación.
  - `SolicitudReservaModal.tsx`: Consulta reactiva de feriados activos, banner de alerta y bloqueo del botón de envío.
- **Evidencia de Pruebas:**
  - `test_feriados_hu29.js`: Script de prueba integral que valida la creación, el rechazo de reservas con código 409 y la reapertura inmediata tras la anulación con código 201.

