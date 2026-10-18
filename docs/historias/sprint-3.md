# Documentación Técnica de Historias de Usuario — Sprint 3

> **Periodo:** Semanas 5 y 6 (27/10/2026 – 09/11/2026)  
> **Objetivo del Sprint:** Implementar la resiliencia operativa y casos de borde: bloqueos por mantenimiento con cancelación en cascada, cancelaciones voluntarias y forzosas, tareas programadas desatendidas (no-show), auditoría de sesiones de seguridad, dashboard estadístico y exportación de reportes formales a hojas de cálculo.  
> **Puntos de Historia Totales:** 39 pts.

---

<a id="hu-10"></a>
## HU-10: Gestión de Estado Operativo de Laboratorio
- **Épica:** Laboratorios
- **Responsable:** Marco Callisaya Chirinos
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Analizar** (Evaluación de impacto sobre reservas activas y trazabilidad silenciosa en auditoría).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Cambio de Estado:** El Responsable o Administrador puede alternar el laboratorio entre `Activo` e `Inactivo` con un solo clic.
2. **Ocultamiento Inmediato:** Al pasar a `Inactivo`, el laboratorio deja de figurar como disponible en el catálogo público y en el calendario interactivo.
3. **Alerta de Reservas Afectadas:** Si existen reservas confirmadas para la fecha en curso o fechas futuras, el sistema muestra una ventana emergente detallando la cantidad de docentes y materias afectadas.
4. **Auditoría Silenciosa:** Todo cambio de estado operativo registra en la tabla `auditoria` el correo del responsable, la fecha/hora exacta y el estado anterior y nuevo.

### 2. Especificación Técnica
- **Endpoints:**
  - `PATCH /api/laboratorios/:id/estado-operativo` (Solo Resp/Admin) -> Body: `{ estadoOperativo: 'Activo' | 'Inactivo', motivo?: string }` -> `200 OK`

---

<a id="hu-11"></a>
## HU-11: Registro de Reporte de Mantenimiento
- **Épica:** Laboratorios
- **Responsable:** Herlan Ibañez Condori
- **Estimación:** 8 puntos
- **Nivel Bloom:** **Crear** (Diseño de lógica de cancelación en cascada con notificación reactiva y tareas de desbloqueo programado).
- **Estado Actual:** Tabla `Mantenimiento` creada en Prisma schema; lógica de servicio pendiente.

### 1. Criterios de Aceptación
1. **Registro:** El Administrador o Responsable programa un mantenimiento indicando `fechaInicio`, `fechaFin`, `motivo` y `tipo` (Preventivo/Correctivo).
2. **Validación Temporal:** Se valida estrictamente que `fechaFin > fechaInicio` (HTTP 400).
3. **Cancelación en Cascada:** Al aprobar el mantenimiento, el sistema ejecuta una transacción atómica que:
   - Registra el mantenimiento.
   - Pasa a `Cancelada` todas las reservas que colisionen temporalmente con el rango (`motivoCancelacion = 'Mantenimiento: ' + motivo`).
   - Dispara correos de notificación automática y alertas a los docentes afectados.
4. **Desbloqueo Automático:** Un cron job (`mantenimientos.job.ts`) revisa periódicamente; al cumplirse la fecha de fin, el laboratorio se desbloquea automáticamente sin intervención manual.

### 2. Especificación Técnica
- **Endpoints:**
  - `POST /api/mantenimientos` (Resp/Admin) -> Body: `{ laboratorioId, fechaInicio, fechaFin, motivo, tipo }` -> `201 Created`
  - `GET /api/mantenimientos/laboratorio/:id` (Autenticado) -> `200 OK`

---

<a id="hu-18"></a>
## HU-18: Cancelación Voluntaria de Reserva
- **Épica:** Reservas
- **Responsable:** José Luis Canaviri Lopez
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Aplicar** (Regla de negocio con ventana temporal de anticipación).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Liberación de Espacio:** El docente puede cancelar una reserva propia en estado `Pendiente` o `Confirmada`. El horario vuelve a mostrarse libre de inmediato en el calendario público.
2. **Regla de Anticipación:** La cancelación voluntaria solo se permite con al menos **2 horas de anticipación** a la `fechaInicio`. Si transcurre con menor margen, el sistema rechaza la operación (HTTP 422 Unprocessable Entity) indicando que debe coordinar directamente con el responsable.
3. **Aviso Automático:** Se remite un correo automático al Responsable de Laboratorio comunicando la liberación del horario.

### 2. Especificación Técnica
- **Endpoints:**
  - `PUT /api/reservas/:id/cancelar-propia` (Autenticado - Docente titular) -> Body: `{ motivo?: string }` -> `200 OK`

---

<a id="hu-19"></a>
## HU-19: Cancelación Forzosa por Fuerza Mayor
- **Épica:** Reservas
- **Responsable:** José Luis Canaviri Lopez
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Analizar** (Trazabilidad y justificación obligatoria ante eventos imprevistos institucionales).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Intervención Administrativa:** El Responsable o Administrador puede cancelar una reserva ya confirmada ante contingencias institucionales o fallas eléctricas.
2. **Justificación Obligatoria:** Es imperativo ingresar un motivo detallado de fuerza mayor.
3. **Notificación de Urgencia:** El sistema despacha un correo con etiqueta de alta prioridad al docente afectado y emite un evento WebSocket urgente.
4. **Registro en Auditoría:** La cancelación de fuerza mayor se registra mandatoriamente en la tabla `auditoria`.

### 2. Especificación Técnica
- **Endpoints:**
  - `PUT /api/reservas/:id/cancelar-fuerza-mayor` (Solo Resp/Admin) -> Body: `{ motivo: string }` -> `200 OK`

---

<a id="hu-24"></a>
## HU-24: Cancelación Automática por Inasistencia (No-Show)
- **Épica:** Asistencia (QR)
- **Responsable:** Fernando Vera Vera
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Crear** (Procesos desatendidos con workers en segundo plano y penalización automática).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Detección Automática:** Cada 1 minuto, un worker en background (`node-cron`) busca reservas en estado `Confirmada` cuya `fechaInicio` haya pasado hace más de 15 minutos y donde `horaAsistencia` permanezca nulo.
2. **Transición a Inasistencia:** El estado cambia automáticamente a `Inasistencia`.
3. **Liberación Inmediata:** El calendario y catálogo reflejan la disponibilidad del laboratorio para el resto del bloque horario.
4. **Registro de Penalización:** El evento queda indexado en el historial del docente para control del comité académico.

### 2. Especificación Técnica
- **Job Background (`jobs/inasistencias.job.ts`):**
  ```typescript
  import cron from 'node-cron';
  import prisma from '../config/prisma';

  // Barrido cada minuto
  cron.schedule('* * * * *', async () => {
    const limite = new Date(Date.now() - 15 * 60 * 1000);
    const afectadas = await prisma.reserva.updateMany({
      where: {
        estado: 'Confirmada',
        horaAsistencia: null,
        fechaInicio: { lte: limite }
      },
      data: { estado: 'Inasistencia' }
    });
  });
  ```

---

<a id="hu-04"></a>
## HU-04: Actualización de Información de Perfil
- **Épica:** Seguridad
- **Responsable:** Marco Callisaya Chirinos
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Aplicar** (Manejo de archivos multipart/form-data y validación estricta de formatos MIME).
- **Estado Actual:** Backend parcial; falta carga de fotos con `multer` y frontend.

### 1. Criterios de Aceptación
1. **Actualización de Datos:** El usuario puede actualizar su número telefónico y subir una foto de perfil.
2. **Restricción de Correo:** El campo correo se presenta en modo de solo lectura (deshabilitado).
3. **Validación Numérica:** El teléfono solo admite caracteres numéricos.
4. **Límites de Imagen:** Archivos restringidos a formatos gráficos JPG/PNG con peso máximo de 2 MB.
5. **Advertencia de Cambios:** En el frontend, si el usuario intenta navegar fuera del formulario con cambios pendientes, se dispara un diálogo de confirmación.

### 2. Especificación Técnica
- **Endpoints:**
  - `PUT /api/usuarios/perfil` (Autenticado) -> `multipart/form-data` -> Body: `{ telefono, foto?: File }` -> `200 OK`

---

<a id="hu-05"></a>
## HU-05: Historial de Accesos y Sesiones
- **Épica:** Seguridad
- **Responsable:** Andrés Montaño Frias
- **Estimación:** 4 puntos
- **Nivel Bloom:** **Analizar** (Monitoreo de seguridad forense y filtrado temporal paginado).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Registro Silencioso:** En cada inicio de sesión exitoso (HU-01), el sistema guarda en la tabla `sesiones` el `usuarioId`, la dirección IP del cliente, el User-Agent y la marca de tiempo.
2. **Visualización Admin:** Solo el Administrador accede a la pantalla de auditoría de sesiones.
3. **Filtros Avanzados:** Permite filtrar por rango de fechas y por correo electrónico de usuario.
4. **Paginación:** Vista paginada a 20 resultados por página.
5. **Solo Lectura:** No existe ninguna opción de borrado ni alteración de registros.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/auditoria/sesiones?correo=&desde=&hasta=&page=1&limit=20` (Solo Admin) -> `200 OK`
- **Modelo de Datos:**
  - `Sesion (id, usuario_id, ip, user_agent, creado_en)`.

---

<a id="hu-21"></a>
## HU-21: Historial de Reservas Personales
- **Épica:** Reservas
- **Responsable:** Fernando Vera Vera
- **Estimación:** 2 puntos
- **Nivel Bloom:** **Aplicar** (Filtrado de estado en cliente/servidor y ordenamiento cronológico descendente).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Listado Personal:** El Docente visualiza todas sus reservas pasadas y futuras ordenadas desde la más reciente.
2. **Pestañas Rápidas:** Botones para filtrar instantáneamente entre `Todas`, `Confirmadas`, `Pendientes`, `Canceladas` e `Inasistencias`.
3. **Acceso al QR:** Enlace directo para abrir el código QR en las reservas de la jornada actual.

### 2. Especificación Técnica
- **Endpoints:** `GET /api/reservas/mis-reservas?estado=` (Autenticado - Docente/Auxiliar) -> `200 OK`

---

<a id="hu-26"></a>
## HU-26: Dashboard de Estadísticas de Uso
- **Épica:** Reportes
- **Responsable:** Miguel Rodriguez Peña
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Evaluar** (Agregación analítica de datos operacionales para toma de decisiones y visualización de cuellos de botella).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Métricas de Ocupación:** Gráficos estadísticos con el porcentaje mensual de uso y horas efectivas por cada laboratorio.
2. **Horarios Pico de Conflicto:** Gráfico de barras que visibiliza las franjas horarias y días de la semana con mayor cantidad de colisiones concurrentes (solicitudes respondidas con código 409).
3. **Rendimiento Frontend:** La librería de visualización (`recharts`) se carga de forma diferida (`bundle-dynamic-imports`) para no penalizar el tiempo de carga del catálogo estudiantil.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/reportes/dashboard` (Solo Admin) -> Devuelve `{ porcentajeUsoPorLab: [...], horariosPicoColision: [...] }` empleando `Promise.all` para ejecutar las consultas de agregación en paralelo (`async-parallel`).
- **Frontend:**
  - `features/reportes/DashboardPage.tsx` con componentes `BarChart` y `PieChart`.

---

<a id="hu-27"></a>
## HU-27: Exportación de Reportes en Formato Excel/CSV
- **Épica:** Reportes
- **Responsable:** Miguel Rodriguez Peña
- **Estimación:** 3 puntos
- **Nivel Bloom:** **Aplicar** (Generación en streaming de binarios OpenXML en el servidor Node.js).
- **Estado Actual:** Pendiente de implementación.

### 1. Criterios de Aceptación
1. **Descarga Formal:** El Administrador puede descargar un archivo XLSX generado por el servidor con la auditoría de uso de laboratorios.
2. **Respeto de Filtros:** Si el Administrador tiene aplicado un filtro por mes o por carrera, el archivo Excel generado contiene exactamente esos registros filtrados.
3. **Formato Tabular Limpio:** Encabezados estilizados, columnas con ancho adaptado, fechas legibles y tipos de datos numéricos correctos para el cálculo en hojas de cálculo.

### 2. Especificación Técnica
- **Librería Backend:** `exceljs`.
- **Endpoints:**
  - `GET /api/reportes/exportar-excel?laboratorioId=&mes=&anio=` (Solo Admin)
    - Headers de respuesta:
      - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
      - `Content-Disposition: attachment; filename="reporte_laboratorios_2026-10.xlsx"`
