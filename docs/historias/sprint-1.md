# Documentación Técnica de Historias de Usuario — Sprint 1

> **Periodo:** Semanas 1 y 2 (Hasta 12/10/2026)  
> **Objetivo del Sprint:** Implementar y validar los fundamentos de autenticación, control de roles (RBAC), catálogo público, configuración de horarios y consulta interactiva en calendario tanto en Backend (API REST) como en Frontend (React).  
> **Puntos de Historia Totales:** 45 pts.

---

<a id="hu-01"></a>
## HU-01: Registro e Inicio de Sesión
- **Épica:** Seguridad
- **Responsable:** José Luis Canaviri Lopez
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Aplicar** (Implementación de hashing bcrypt, firma JWT y manejo de tokens temporales de activación).
- **Estado Actual:** Backend completado al 80% (falta bloqueo de 5 intentos fallidos); Frontend pendiente (pantallas `/login` y `/register`).

### 1. Criterios de Aceptación
1. **Registro:** Dado que un visitante llena el formulario con su correo personal y contraseña, cuando envía los datos, el sistema crea la cuenta inactiva (`correoVerificado: false`, `rol: Estudiante`) y despacha un correo con token de activación firmado (vigencia 24h).
2. **Activación:** Dado que el usuario accede al enlace del correo, cuando la API valida el token, la cuenta pasa a activa y se le permite iniciar sesión.
3. **Login Exitoso:** Dado un usuario verificado con credenciales válidas, al autenticarse el servidor emite un JWT firmado (expiración 8h) con `{ id, rol, nombre }`.
4. **Login Erróneo:** Ante contraseña o correo inválido, responde HTTP 401 con mensaje genérico de seguridad.
5. **Bloqueo por Fuerza Bruta:** Ante 5 intentos fallidos consecutivos, el acceso queda temporalmente bloqueado por 15 minutos (HTTP 429).
6. **Logout:** Al cerrar sesión, el cliente destruye el token local y el enrutador redirige a `/login`, impidiendo navegar hacia atrás a rutas protegidas.

### 2. Especificación Técnica
- **Endpoints:**
  - `POST /api/auth/register` (Público) -> Body: `{ nombreCompleto, correo, password, carreraId, telefono? }` -> `201 Created`
  - `GET /api/auth/verificar-correo/:token` (Público) -> `200 OK`
  - `POST /api/auth/login` (Público) -> Body: `{ correo, password }` -> `200 OK { token, usuario: { id, nombre, rol } }` | `401 Unauthorized` | `429 Too Many Requests`
  - `POST /api/auth/google` (Público) -> Body: `{ idToken }` -> `200 OK`
- **Modelo de Datos:**
  - `Usuario`: campos `correo` (unique), `passwordHash`, `correoVerificado`, `intentosFallidos` (default 0), `bloqueadoHasta` (DateTime nullable).
- **Frontend (React 19):**
  - Componentes: `features/auth/LoginPage.tsx`, `features/auth/RegisterPage.tsx`, `features/auth/VerificarCorreoPage.tsx`.
  - Hook: `useAuth()` con contexto `AuthContext` (persiste en `localStorage` con esquema versionado `auth:v1`).
  - Protección de Rutas: `<RutaProtegida roles={['Estudiante', 'Docente', ...]} />`.

### 3. Evidencia de Pruebas
- `auth.test.ts`: Pruebas de registro exitoso, rechazo de correo duplicado (HTTP 400), login exitoso con hash bcrypt y bloqueo en el 6to intento fallido con HTTP 429.

---

<a id="hu-02"></a>
## HU-02: Gestión y Aprobación de Roles
- **Épica:** Seguridad
- **Responsable:** José Luis Canaviri Lopez
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Analizar** (Descomposición de la jerarquía de roles, diseño de permisos de menor privilegio y protección de invariantes del sistema).
- **Estado Actual:** Backend parcial (`roles.controller.ts` implementado); falta validación de último administrador y frontend.

### 1. Criterios de Aceptación
1. **Solicitud:** Un usuario con rol `Estudiante` puede solicitar elevación a `Docente` o `Auxiliar`. La solicitud queda en estado `Pendiente`.
2. **Aprobación Admin:** El Administrador visualiza la bandeja de solicitudes y puede aprobar una petición. La BD actualiza el `rolId` y se notifica al usuario.
3. **Rechazo Admin:** Al rechazar, el usuario permanece con su rol actual y la solicitud pasa a `Rechazada`.
4. **Revocación:** El Administrador puede revocar el rol de un docente o auxiliar regresándolo a `Estudiante`.
5. **Invariante Crítica:** El sistema bloquea cualquier intento de un administrador de revocarse o degradarse a sí mismo si es el único Administrador en el sistema (HTTP 422).
6. **Restricción de Acceso:** Cualquier intento de un no-administrador de invocar endpoints de gestión responde HTTP 403 Forbidden.

### 2. Especificación Técnica
- **Endpoints:**
  - `POST /api/roles/request` (Autenticado) -> Body: `{ rolSolicitado: 'Docente' | 'Auxiliar', motivo? }` -> `201 Created`
  - `GET /api/roles/requests` (Solo Admin) -> Query: `?estado=Pendiente` -> `200 OK { data: [...] }`
  - `PUT /api/roles/manage/:id` (Solo Admin) -> Body: `{ accion: 'Aprobar' | 'Rechazar' }` -> `200 OK`
  - `PUT /api/roles/revocar/:usuarioId` (Solo Admin) -> `200 OK`
- **Modelo de Datos:**
  - Tabla `solicitudes_rol (id, usuario_id, rol_solicitado, estado, creado_en)`.
- **Frontend:**
  - `features/admin/BandejaRolesPage.tsx`: Tabla con solicitudes pendientes, botones de acción inmediata con modal de confirmación.

---

<a id="hu-03"></a>
## HU-03: Restablecimiento de Contraseña
- **Épica:** Seguridad
- **Responsable:** José Luis Canaviri Lopez
- **Estimación:** 4 puntos
- **Nivel Bloom:** **Aplicar** (Uso de tokens criptográficos de un solo uso con ventana de expiración estricta).
- **Estado Actual:** Backend implementado; requiere persistencia de un solo uso para evitar reutilización del enlace.

### 1. Criterios de Aceptación
1. **Solicitud de Enlace:** El usuario ingresa su correo en `/forgot-password`. Si existe, se genera un token criptográfico seguro válido por 15 minutos y se envía por correo.
2. **Anti-Enumeración:** Si el correo no existe en la base de datos, el sistema responde con el mismo mensaje genérico de éxito para evitar ataques de enumeración de usuarios.
3. **Restablecimiento:** Al ingresar al enlace con token válido, el formulario permite registrar la nueva contraseña.
4. **Un Solo Uso:** Una vez restablecida la contraseña, el token queda invalidado de inmediato. Cualquier reintento con el mismo enlace responde HTTP 400 Bad Request.

### 2. Especificación Técnica
- **Endpoints:**
  - `POST /api/auth/forgot-password` (Público) -> Body: `{ correo }` -> `200 OK`
  - `POST /api/auth/reset-password` (Público) -> Body: `{ token, nuevaPassword }` -> `200 OK`
- **Modelo de Datos:**
  - Tabla `tokens_reset (id, usuario_id, token_hash, expira_en, usado_en)`.

---

<a id="hu-06"></a>
## HU-06: Creación de Perfil de Laboratorio
- **Épica:** Laboratorios
- **Responsable:** Herlan Ibañez Condori
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Aplicar** (Validación de esquemas Zod en backend y formularios tipados en React).
- **Estado Actual:** Backend funcional en `laboratorios.controller.ts`; falta integración frontend.

### 1. Criterios de Aceptación
1. **Registro:** El Administrador registra nombre, capacidad (>0), ubicación, carrera y aforo de computadoras. Se guarda con estado operativo `Activo`.
2. **Unicidad:** Si el nombre del laboratorio ya existe en la base de datos, rechaza con HTTP 409 Conflict.
3. **Validación de Capacidad:** Si la capacidad es <= 0 o no entera, responde HTTP 400 Bad Request con mensaje descriptivo.
4. **Campos Requeridos:** Ubicación y nombre no pueden ser cadenas vacías.

### 2. Especificación Técnica
- **Endpoints:**
  - `POST /api/laboratorios` (Solo Admin) -> Body: `{ nombre, capacidad, ubicacion, carreraId, imagenUrl?, reservaPorComputadora }` -> `201 Created`
- **Frontend:**
  - `features/admin/LabFormModal.tsx` con React Hook Form y validación visual inmediata.

---

<a id="hu-07"></a>
## HU-07: Configuración de Días y Horarios Operativos
- **Épica:** Laboratorios
- **Responsable:** Miguel Rodriguez Peña
- **Estimación:** 7 puntos
- **Nivel Bloom:** **Analizar** (Modelado temporal de rangos horarios y detección de solapamiento entre bloques matutinos y vespertinos).
- **Estado Actual:** Backend básico existente; requiere validación de coherencia temporal (cierre > apertura) y soporte de dos turnos diarios.

### 1. Criterios de Aceptación
1. **Asignación de Horario:** El Administrador define los bloques de funcionamiento semanal por día (ej. Lunes 08:00 - 12:00 y 14:00 - 18:00).
2. **Coherencia Horaria:** Se rechaza cualquier bloque donde `horaCierre <= horaApertura` (HTTP 400).
3. **Solapamiento Interno:** No se permite guardar bloques del mismo día que se superpongan entre sí.
4. **Feriados:** Se dispone de una configuración de fechas bloqueadas donde ningún laboratorio puede ser reservado.

### 2. Especificación Técnica
- **Endpoints:**
  - `POST /api/laboratorios/:id/horarios` (Solo Admin) -> Body: `{ horarios: [{ dia: 'Lunes', horaApertura: '08:00', horaCierre: '12:00' }, ...] }` -> `200 OK`
- **Modelo de Datos:**
  - `HorarioLaboratorio (id, laboratorio_id, dia, hora_apertura, hora_cierre)`.
  - `Feriado (id, fecha, descripcion)`.

---

<a id="hu-08"></a>
## HU-08: Vinculación de Equipamiento
- **Épica:** Laboratorios
- **Responsable:** Herlan Ibañez Condori
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Aplicar** (Gestión de relaciones N:M con atributos adicionales en ORM Prisma).
- **Estado Actual:** Backend parcial (`equipamiento.controller.ts`); falta endpoint de desvinculación y UI.

### 1. Criterios de Aceptación
1. **Vinculación:** El Administrador asocia un ítem del catálogo de equipamiento (ej. Proyector Epson, PCs Core i7) indicando una cantidad entera mayor a cero.
2. **Actualización:** Si el equipo ya estaba vinculado, se actualiza la cantidad disponible.
3. **Desvinculación:** El Administrador puede retirar un equipamiento del laboratorio mediante `DELETE`.
4. **Visualización:** En el catálogo público se visualiza el resumen de hardware y software del laboratorio.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/equipamientos` (Autenticado) -> `200 OK` (catálogo base).
  - `POST /api/equipamientos/laboratorio/:id` (Solo Admin) -> Body: `{ equipamientoId, cantidad }` -> `200 OK`.
  - `DELETE /api/equipamientos/laboratorio/:id/:equipamientoId` (Solo Admin) -> `200 OK`.

---

<a id="hu-12"></a>
## HU-12: Catálogo General de Laboratorios
- **Épica:** Búsqueda
- **Responsable:** Marco Callisaya Chirinos
- **Estimación:** 4 puntos
- **Nivel Bloom:** **Aplicar** (Paginación eficiente en BD y renderizado responsivo de tarjetas en React).
- **Estado Actual:** Endpoint básico implementado; falta paginación fija de 15 resultados, orden alfabético y UI completa.

### 1. Criterios de Aceptación
1. **Cuadrícula Pública:** Cualquier usuario (incluso Estudiante o visitante autenticado) puede ver las tarjetas de laboratorios ordenadas alfabéticamente.
2. **Paginación:** El servidor pagina a un máximo de 15 laboratorios por página (`?page=1&limit=15`).
3. **Filtro de Inactivos:** Los laboratorios con `estadoOperativo = 'Inactivo'` quedan ocultos del catálogo general de reserva.
4. **Diseño Responsivo:** En resoluciones móviles (< 768px), las tarjetas se apilan verticalmente en una sola columna sin roturas de layout.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/laboratorios?page=1&limit=15` (Público/Autenticado) -> `200 OK { data: [...], meta: { total, page, totalPages } }`
- **Frontend:**
  - `features/catalogo/CatalogoPage.tsx`, `features/catalogo/LabCard.tsx`.
  - Uso de `React Query` con `staleTime: 30_000` para reducir consultas al servidor.

---

<a id="hu-13"></a>
## HU-13: Calendario Interactivo de Disponibilidad
- **Épica:** Búsqueda
- **Responsable:** Fernando Vera Vera
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Analizar** (Procesamiento y mapeo temporal en memoria para pintar bloques de disponibilidad).
- **Estado Actual:** Endpoint base en `horarios_calendario.controller.ts`; falta vista visual semanal interactiva.

### 1. Criterios de Aceptación
1. **Vista Semanal:** Al seleccionar un laboratorio, el calendario muestra por defecto la semana actual dividida en bloques de horas operativas.
2. **Codificación de Colores:** Bloques en **Verde** (disponible), **Rojo** (reserva confirmada/pendiente), **Gris** (horario pasado o fuera de servicio).
3. **Navegación:** Botones para adelantar o retroceder semanas en el futuro.
4. **Interacción:** Hacer clic en un bloque verde redirige automáticamente al formulario de reserva con el laboratorio y las horas preseleccionadas.

### 2. Especificación Técnica
- **Endpoints:**
  - `GET /api/laboratorios/:id/calendario?fecha=2026-10-12` (Autenticado) -> Devuelve los horarios de apertura y las reservas del laboratorio en esa semana.
- **Frontend:**
  - `features/laboratorio/CalendarioSemanal.tsx`: Grilla CSS memoizada (`rerender-memo`) usando un `Map` para búsqueda O(1) de reservas por celda.

---

<a id="hu-14"></a>
## HU-14: Filtrado Avanzado de Laboratorios
- **Épica:** Búsqueda
- **Responsable:** Andrés Montaño Frias
- **Estimación:** 5 puntos
- **Nivel Bloom:** **Analizar** (Composición dinámica de cláusulas `WHERE` condicionales en Prisma).
- **Estado Actual:** Filtros en controlador backend parciales; falta integración con barra lateral en frontend.

### 1. Criterios de Aceptación
1. **Filtro de Capacidad:** Filtra por aforo mínimo (ej. `capacidad >= 40`).
2. **Filtro Combinado:** Permite combinar simultáneamente carrera, capacidad y si requiere computadoras individuales.
3. **Estado en URL:** Los filtros se sincronizan con los search params de la URL (`?capacidad=30&carrera=1`) permitiendo compartir enlaces y mantener el historial de navegación sin `useEffect` innecesarios (`rerender-derived-state-no-effect`).
4. **Estado Vacío:** Si ningún laboratorio coincide, renderiza una ilustración y mensaje amigable de "No se encontraron coincidencias".

### 2. Especificación Técnica
- **Query Params:** `GET /api/laboratorios?capacidad=30&carreraId=2&reservaPorComputadora=true&page=1`
- **Frontend:** `features/catalogo/FiltrosSidebar.tsx`, `components/ui/EmptyState.tsx`.
