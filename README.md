# LabReserve - Sistema de Gestión y Reservas de Laboratorios FCyT UMSS

Plataforma universitaria para la administración, reserva, control de asistencia QR y auditoría de laboratorios de computación y salas especializadas de la Facultad de Ciencias y Tecnología (FCyT) de la Universidad Mayor de San Simón (UMSS).

---

## 1. Arquitectura y Tecnologías

El sistema sigue una arquitectura de **Monolito Modular** desacoplado en Frontend y Backend:

- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL, Zod, JWT, Google Auth Library, Nodemailer.
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Leaflet (Mapas Campus), SheetJS XLSX, QRcode.
- **Workers Autónomos:** Demonio en segundo plano para verificación periódica y sanción automática por inasistencia no justificada.

---

## 2. Estructura del Repositorio

```text
├── backend/
│   ├── prisma/                  # Esquema Prisma, migraciones y seeders
│   ├── src/
│   │   ├── config/              # Inicialización de Prisma y conexiones
│   │   ├── controllers/         # Controladores HTTP (Req, Res)
│   │   ├── errors/              # Excepciones tipadas de dominio
│   │   ├── helpers/             # Utilidades de colisión, horarios y correos
│   │   ├── middlewares/         # Autenticación JWT y validación de esquemas
│   │   ├── routes/              # Declaración y versionamiento de endpoints
│   │   ├── services/            # Lógica de negocio y transacciones de base de datos
│   │   ├── validators/          # Esquemas de validación Zod
│   │   └── workers/             # Tareas programadas en segundo plano
│   └── .env.example             # Plantilla de variables de entorno del servidor
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Clientes HTTP por dominio (Axios)
│   │   ├── components/          # Componentes reutilizables y modales
│   │   │   ├── admin/           # Paneles y tablas del módulo de administración
│   │   │   ├── escanear/        # Visor de cámara QR y registro de pases
│   │   │   ├── laboratorios/    # Calendarios y selectores de laboratorio
│   │   │   ├── perfil/          # Gestión de cuenta y reservas personales
│   │   │   └── reportes/        # KPIs, gráficos analíticos y tablas de auditoría
│   │   ├── hooks/               # Custom hooks de analítica y cálculo
│   │   ├── pages/               # Vistas principales y rutas del sistema
│   │   └── utils/               # Exportadores a Excel (.xlsx), CSV y PDF oficial
│   └── .env.example             # Plantilla de variables de entorno del cliente
└── README.md                    # Documentación central del proyecto
```

---

## 3. Requisitos de Instalación

- **Node.js:** Versión 18 o superior.
- **PostgreSQL:** Base de datos relacional activa.
- **NPM** o gestor de paquetes compatible.

---

## 4. Puesta en Marcha

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

## 5. Módulos y Funcionalidades Principales

1. **Gestión de Identidad y Roles:**
   - Registro con validación de CI, desbloqueo automático en registros no verificados y reenvío de activación.
   - Inicio de sesión institucional por correo y contraseña o mediante Google OAuth.
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
