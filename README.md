# LabReserve - Sistema de Gestión y Reservas de Laboratorios FCyT UMSS

Plataforma universitaria para la administración, reserva, control de asistencia QR, Progressive Web App (PWA) y auditoría analítica de laboratorios de computación y salas especializadas de la Facultad de Ciencias y Tecnología (FCyT) de la Universidad Mayor de San Simón (UMSS).

---

## 1. Arquitectura y Tecnologías

El sistema sigue una arquitectura desacoplada en Frontend y Backend:

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Leaflet (Mapas Campus), SheetJS XLSX, QRcode.
- **PWA (Progressive Web App):** Service Worker nativo para caché estática, manifiesto web para instalación como app nativa en dispositivos móviles (Android/iOS) y de escritorio (Windows/macOS/Linux).
- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL (Supabase/Local), Zod, JWT, Google Auth Library, Nodemailer.
- **Seguridad y Resiliencia:** Rate Limiting nativo en memoria, HSTS forzado, protección contra DoS, ocultamiento de fingerprint de servidor y apagado ordenado (graceful shutdown).
- **Workers Autónomos:** Demonio en segundo plano desatendido para verificación periódica de turnos vencidos y sanción automática por inasistencia no justificada.

---

## 2. Documentación Técnica del Proyecto

Para consultar el detalle de especificaciones técnicas, referirse a los siguientes documentos ubicados en el directorio `docs/`:

1. [Guía Oficial de Despliegue en Producción](file:///C:/Users/jl153/OneDrive/Documentos/GitHub/API-trivago-campus-universitario/docs/GUIA_DESPLIEGUE.md): Procedimiento paso a paso para Supabase, Render.com y Vercel con HTTPS.
2. [Especificación de la API REST](file:///C:/Users/jl153/OneDrive/Documentos/GitHub/API-trivago-campus-universitario/docs/API_DOCUMENTATION.md): Catálogo exhaustivo de endpoints, parámetros, respuestas y códigos de estado.
3. [Arquitectura del Sistema y Modelo de Datos](file:///C:/Users/jl153/OneDrive/Documentos/GitHub/API-trivago-campus-universitario/docs/ARQUITECTURA_Y_BASE_DE_DATOS.md): Esquema relacional Prisma, concurrencia de reservas y ciclo de vida de turnos.

---

## 3. Estructura del Repositorio

```text
├── backend/
│   ├── prisma/                  # Esquema Prisma, migraciones, seeders y concurrencia
│   ├── src/
│   │   ├── config/              # Inicialización de Prisma y conexiones
│   │   ├── controllers/         # Controladores HTTP (Req, Res)
│   │   ├── errors/              # Excepciones tipadas de dominio
│   │   ├── helpers/             # Utilidades de colisión, horarios y correos
│   │   ├── middlewares/         # Autenticación JWT, validación Zod y Rate Limiting
│   │   ├── routes/              # Declaración y versionamiento de endpoints
│   │   ├── services/            # Lógica de negocio y transacciones de base de datos
│   │   ├── validators/          # Esquemas de validación Zod
│   │   └── workers/             # Tareas programadas en segundo plano
│   └── .env.example             # Plantilla de variables de entorno del servidor
│
├── frontend/
│   ├── public/                  # Manifiesto PWA, iconos e instalador Service Worker
│   │   ├── manifest.webmanifest # Configuración PWA standalone
│   │   └── sw.js                # Service Worker para caché y soporte offline
│   ├── src/
│   │   ├── api/                 # Clientes HTTP por dominio (Axios / apiClient)
│   │   ├── components/          # Componentes reutilizables, modales y Navbar PWA
│   │   ├── hooks/               # Custom hooks de analítica y cálculo
│   │   ├── pages/               # Vistas principales y rutas del sistema
│   │   └── utils/               # Exportadores a Excel (.xlsx), CSV y PDF oficial
│   ├── vercel.json              # Configuración de hosting Vercel con HSTS y SPA rewrites
│   └── .env.example             # Plantilla de variables de entorno del cliente
│
├── docs/                        # Documentación técnica y guías operativas
│   ├── API_DOCUMENTATION.md     # Catálogo de endpoints REST
│   ├── ARQUITECTURA_Y_BASE_DE_DATOS.md # Modelo relacional y concurrencia
│   └── GUIA_DESPLIEGUE.md       # Manual de despliegue en la nube
└── README.md                    # Documentación central del proyecto
```

---

## 4. Requisitos de Instalación

- **Node.js:** Versión 18 o superior (LTS recomendada).
- **PostgreSQL:** Base de datos relacional activa (local o Supabase).
- **NPM** o gestor de paquetes compatible.

---

## 5. Puesta en Marcha en Desarrollo Local

### Paso 1: Configurar el Backend

1. Ingresar a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar la plantilla de entorno y configurar credenciales:
   ```bash
   cp .env.example .env
   ```
4. Sincronizar la estructura con PostgreSQL:
   ```bash
   npx prisma db push
   ```
5. (Opcional) Poblar datos de prueba universitarios:
   ```bash
   npx prisma db seed
   ```
6. Iniciar el servidor backend:
   ```bash
   npm run dev
   ```
   *El servidor quedará operativo en http://localhost:3000*

### Paso 2: Configurar el Frontend

1. Abrir otra terminal e ingresar a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar la plantilla de entorno:
   ```bash
   cp .env.example .env
   ```
4. Iniciar la aplicación web:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en http://localhost:5173*

---

## 6. Módulos y Funcionalidades Principales

1. **Gestión de Identidad y Roles:**
   - Registro con validación de CI, desbloqueo automático en registros no verificados y reenvío de activación.
   - Inicio de sesión institucional por correo y contraseña o mediante Google OAuth 2.0.
   - Asignación y solicitudes de ascenso de rol (Estudiante, Docente, Administrador, Responsable de Laboratorio).

2. **Sistema de Reservas:**
   - Reserva individual por computadora (estudiantes) con selección de equipo y prevención de solapamientos.
   - Reserva de laboratorio completo por bloques (docentes) con control semestral recurrente.
   - Cancelación por el titular o por fuerza mayor universitaria con notificación en tiempo real.

3. **Control de Asistencia QR y Acreditación:**
   - Generación de código QR y boleta oficial de reserva con opción de guardado en PDF o impresión.
   - Módulo de escaneo con cámara web o registro manual de asistencia por C.I.
   - Detección de inasistencias y aplicación automática de sanciones temporales tras período de gracia.

4. **Auditoría y Analítica Avanzada:**
   - Tableros KPI de ocupación, comparativa por carreras académicas y demanda horaria.
   - Exportación nativa a Excel (.xlsx multi-hoja) y CSV estándar.
   - Generación de informe oficial de auditoría en formato PDF institucional con sello y firmas.

5. **Experiencia Móvil PWA:**
   - Botón interactivo "Instalar App" para instalación directa en dispositivos móviles o escritorio sin pasar por tiendas de aplicaciones.
   - Caché local de activos estáticos para tiempos de carga inmediatos.

---

## 7. Protocolos de Seguridad y Resiliencia Implementados

1. **Rate Limiting (Protección Anti-Fuerza Bruta):**
   - Límite de 15 intentos cada 15 minutos en rutas sensibles de autenticación (`/api/auth/login`, `/register`, etc.).
   - Límite general de 300 peticiones por minuto por IP en toda la API.
2. **Cabeceras Defensivas HTTP:**
   - `Strict-Transport-Security` (HSTS) para forzar tráfico HTTPS cifrado.
   - `X-Frame-Options: DENY` contra ataques de Clickjacking.
   - `X-Content-Type-Options: nosniff` contra ataques de inyección MIME.
   - `X-XSS-Protection: 1; mode=block` contra secuencias de comandos maliciosas.
3. **Crash Prevention y Apagado Ordenado:**
   - Manejadores de `uncaughtException` y `unhandledRejection` para evitar caídas del proceso Node.js.
   - Cierre controlado (`SIGTERM` / `SIGINT`) que libera el puerto HTTP y desconecta el cliente de Prisma limpiamente.
4. **Ocultamiento de Huella:**
   - Cabecera `X-Powered-By` deshabilitada para mitigar el escaneo automatizado de vulnerabilidades de Express.
5. **Control de Sobrecarga:**
   - Límite de carga útil JSON a 2MB para evitar saturación de memoria RAM en el servidor.