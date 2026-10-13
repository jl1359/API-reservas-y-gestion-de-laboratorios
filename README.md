# API Trivago Campus Universitario

Motor Central de Gestión de Recursos Físicos del Campus (Reservas de Laboratorios + Búsqueda de Aulas).
Desarrollado con una arquitectura de **Monolito Modular** utilizando TypeScript, Express, Prisma, Zod y React.

---

## 🚀 Guía de Instalación y Ejecución

### 1. Requisitos Previos
- **Node.js** (v18 o superior)
- **PostgreSQL** (Motor de base de datos relacional)
- **Git** (Opcional)

### 2. Configuración de la Base de Datos
1. Abre tu gestor de base de datos (pgAdmin, DBeaver, o consola psql) e inicia el servidor PostgreSQL.
2. Crea una base de datos vacía. Por ejemplo, llámala `trivago_campus`.
3. Ve a la carpeta `backend/` y abre el archivo `.env`.
4. Reemplaza la variable `DATABASE_URL` con las credenciales reales de tu base de datos local:
   ```env
   DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/trivago_campus?schema=public"
   ```

### 3. Instalación del Backend (API REST)
Abre una terminal y ejecuta los siguientes comandos:
```bash
cd backend
npm install

# Generar y empujar las tablas a la base de datos usando Prisma
npx prisma db push

# Iniciar el servidor en modo desarrollo (nodemon)
npm run dev
```
*(El backend debería estar corriendo ahora en http://localhost:3000)*

### 4. Instalación del Frontend (React + Vite)
Abre **otra** terminal nueva y ejecuta:
```bash
cd frontend
npm install

# Iniciar el cliente de React en modo desarrollo
npm run dev
```
*(El frontend debería estar corriendo en http://localhost:5173)*

---

## 📁 Estructura del Proyecto

- **/backend**: Contiene el código de la API estructurado por módulos (`auth`, `classrooms`, `reservations`, etc).
- **/frontend**: Contiene la interfaz de usuario con React y Tailwind CSS v4.

*¡Listo para programar!*