# LabReserve - Sistema Telemático de Gestión y Reservas de Laboratorios FCyT UMSS

Plataforma universitaria para la administración, búsqueda, reserva concurrente, control de asistencia QR, comunicación en tiempo real (SSE), Progressive Web App (PWA) y auditoría analítica de laboratorios de computación y salas especializadas de la Facultad de Ciencias y Tecnología (FCyT) de la Universidad Mayor de San Simón (UMSS).

---

## 1. Arquitectura y Tecnologías

El sistema implementa una arquitectura cliente-servidor desacoplada y orientada a servicios telemáticos:

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet (Mapas Campus), SheetJS XLSX, QRcode.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (con extensión `btree_gist`), Zod, JWT, Google Auth Library, Nodemailer.
- **Comunicación en Tiempo Real:** Canal unidireccional persistente mediante Server-Sent Events (SSE) en `/api/realtime/stream` para actualización instantánea de reservas y estados sin sondeo HTTP (polling).
- **Control de Concurrencia a Nivel de Base de Datos:** Restricción de exclusión mutua (`btree_gist`) en PostgreSQL para evitar solapamientos (`race conditions`) en reservas simultáneas con respuesta HTTP 409 Conflict.
- **PWA (Progressive Web App):** Service Worker nativo para caché estática y soporte offline parcial, con manifiesto web para instalación standalone en escritorio y móviles.
- **Contenedorización:** Dockerfiles optimizados para backend y frontend, y orquestación integral mediante `docker-compose.yml`.
- **Workers Autónomos:** Proceso en segundo plano para auditoría de turnos vencidos y aplicación automática de sanciones disciplinarias temporales por inasistencia.

---

## 2. Despliegue Rápido con Docker (Recomendado)

El entorno completo (Base de Datos PostgreSQL con extensión `btree_gist`, Backend y Frontend servido con Nginx) se levanta con un solo comando:

```bash
docker compose up --build
```

### Puertos expuestos:
- **Frontend Web:** [http://localhost:5173](http://localhost:5173) (o puerto configurado en docker-compose)
- **API REST Backend:** [http://localhost:3000](http://localhost:3000)
- **Base de Datos PostgreSQL:** `localhost:5432`

Para detener los servicios:
```bash
docker compose down
```

---

## 3. Puesta en Marcha en Desarrollo Local (Sin Docker)

### Requisitos Previos:
- **Node.js:** Versión 18 o superior (v20 o v24 LTS recomendada).
- **PostgreSQL:** Base de datos activa con la extensión `btree_gist` habilitada.
- **NPM** o gestor de paquetes compatible.

### Paso 1: Configurar el Backend

1. Ingresar a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   *Asegúrate de configurar `DATABASE_URL` y `DIRECT_URL` con tu instancia de PostgreSQL.*
4. Sincronizar el esquema de base de datos y habilitar la restricción de concurrencia:
   ```bash
   npx prisma db push
   npm run migrate:concurrencia
   ```
5. Poblar los datos iniciales de la universidad (roles, carreras, laboratorios y cuentas demo):
   ```bash
   npx prisma db seed
   ```
6. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor quedará operativo en http://localhost:3000*

### Paso 2: Configurar el Frontend

1. En una nueva terminal, ingresar a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Iniciar la aplicación web:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en http://localhost:5173*

---

## 4. Suite Automatizada de Pruebas (`npm test`)

El backend cuenta con una suite de pruebas automatizadas que valida la robustez transaccional y los protocolos de seguridad sin alterar el entorno productivo.

Para ejecutar las pruebas:
```bash
cd backend
npm test
```

### Casos evaluados en la suite:
1. **Control de Concurrencia Atómica (Exclusión Mutua):** Dispara dos reservas simultáneas en el mismo milisegundo mediante `Promise.allSettled`. Valida que exactamente una solicitud es aprobada (`201` / `Aprobada`) y que la colisión es rechazada con **HTTP 409 Conflict**.
2. **Seguridad y Control Disciplinario:** Intento de reserva con un usuario sancionado, validando que el servidor bloquea la solicitud retornando **HTTP 403 Forbidden** (`PRIVILEGIOS_SUSPENDIDOS_SANCION`).
3. **Validación de Integridad y Horarios:** Rechazo de solicitudes con fechas pasadas o con orden cronológico invertido retornando **HTTP 400 Bad Request**.
4. **Protocolos Telemáticos y Telemetría SSE:** Verificación de estado de salud del servidor (`/api/health`) y métricas en vivo de clientes conectados (`/api/realtime/stats`) con **HTTP 200 OK**.

---

## 5. Colección de Pruebas Postman

Para pruebas de integración, evaluación docente o auditoría de endpoints, los archivos de especificación se encuentran disponibles en el directorio `docs/`:

1. **Colección:** `docs/LabReserve_FCyT_UMSS.postman_collection.json`
2. **Ambiente Local:** `docs/LabReserve_Local.postman_environment.json`

### Importación en Postman:
1. Abrir Postman y seleccionar **Import**.
2. Seleccionar ambos archivos JSON del directorio `docs/`.
3. Seleccionar el entorno **LabReserve Local** en el selector superior derecho y ejecutar las peticiones de autenticación, reservas y reportes.

---

## 6. Usuarios y Roles Predeterminados (Seed)

El comando de seed (`npx prisma db seed`) genera los siguientes perfiles de prueba para la facultad:

| Rol | Correo Electrónico | Contraseña | Alcance y Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@fcyt.umss.edu.bo` | `Admin123*` | Control total, gestión de usuarios, auditoría, sanciones y métricas SSE |
| **Responsable de Lab** | `responsable@fcyt.umss.edu.bo` | `Responsable123*` | Aprobación de reservas, escaneo QR de asistencia presencial |
| **Docente** | `docente@fcyt.umss.edu.bo` | `Docente123*` | Reserva de laboratorios completos y series semestrales |
| **Estudiante** | `estudiante@fcyt.umss.edu.bo` | `Estudiante123*` | Búsqueda y reserva individual por computadora |

---

## 7. Módulos del Sistema

1. **Catálogo y Búsqueda Inteligente:**
   - Filtro por carrera académica, capacidad de alumnos y equipamiento especializado.
   - Modalidades diferenciadas: reserva de aula completa o puestos individuales por computadora.

2. **Gestión Concurrente de Reservas:**
   - Reserva por computadora con prevención de solapamientos a nivel de base de datos.
   - Cancelación por el titular o cancelación por fuerza mayor universitaria con notificación en tiempo real.

3. **Acreditación Presencial mediante Código QR:**
   - Generación de boleta oficial de reserva con código QR criptográfico único.
   - Escáner QR integrado mediante cámara web y registro manual de asistencia para administradores.
   - Período de gracia de 15 minutos; superado el tiempo sin check-in, el sistema sanciona al usuario automáticamente.

4. **Auditoría y Reportes Oficiales:**
   - Métricas de demanda horaria, tasa de asistencia vs. inasistencia y ranking de laboratorios.
   - Exportación nativa a Excel multi-hoja (`.xlsx`), formato CSV e informe oficial en PDF institucional con sellos.

5. **Servicios Telemáticos en Tiempo Real (SSE):**
   - Transmisión unidireccional de eventos (`reserva_creada`, `asistencia_confirmada`, `sancion_aplicada`).
   - Sincronización automática de tableros de control sin recarga de página ni sondeo repetitivo.

---

## 8. Protocolos de Seguridad y Resiliencia

- **Rate Limiting:** Protección anti-fuerza bruta en rutas de autenticación y límite preventivo contra DoS.
- **Cabeceras HTTP de Seguridad:** `Strict-Transport-Security` (HSTS), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy`.
- **Ocultamiento de Huella de Servidor:** Cabecera `X-Powered-By` deshabilitada para prevenir escaneos automatizados.
- **Tolerancia a Fallos y Graceful Shutdown:** Captura ordenada de señales del sistema operativo (`SIGTERM`/`SIGINT`) para liberar conexiones y puertos limpiamente.
