# Diagnóstico y Auditoría del Estado Actual

## 1. Auditoría del Repositorio

### 1.1. Estado General
Tras inspeccionar el código fuente (`backend/src/` y `frontend/src/`), el proyecto se encuentra en una fase temprana-media (aprox. 30-35% de avance global). El backend tiene un cimiento sólido para el **Sprint 1**, pero el frontend está completamente vacío (0% de avance funcional, solo existe la plantilla por defecto generada por Vite, sin componentes ni rutas).

### 1.2. Estado Transversal
- **Autenticación/Seguridad:** Implementado el flujo de JWT en `auth.controller.ts`. Se hashean las contraseñas con `bcryptjs`. Se implementó el envío de correo de activación de cuenta (HU-01).
- **Control de Acceso (RBAC):** Base de datos preparada (`roles` y `solicitudes_rol`). Faltan middlewares estructurados para bloquear endpoints según el rol en algunas rutas.
- **Manejo de Errores y Validaciones:** Los controladores actuales tienen bloques `try/catch` básicos devolviendo códigos 400 y 500, pero falta una capa centralizada de manejo de excepciones y validación de entrada (ej. usando `Zod` o `Joi`).
- **Tests y CI:** `No iniciada`. No existen archivos de test unitarios (`*.test.ts`) ni pipelines de CI configurados.
- **Documentación API:** Parcial. Existe `test_sprint1.js` para validación rápida, pero falta estandarizar Swagger/OpenAPI o una colección Postman completa.

### 1.3. Estado de la Base de Datos
El esquema (`backend/prisma/schema.prisma`) **coincide casi perfectamente** con la propuesta del informe y, de hecho, la supera. El desarrollador anterior ya implementó soluciones a las falencias del diseño original:
- Se añadió `correoVerificado` (HU-01).
- Se añadió `telefono` (HU-04).
- Se añadió `materia`, `cantidadAlumnos`, `numeroComputadora` a la tabla `Reservas` (HU-15).
- Se añadió tabla `Mantenimiento` (HU-11).
- Se añadió `horaAsistencia` y `tokenQr` (HU-22, HU-23).
- **Diferencia técnica:** Prisma no soporta nativamente restricciones `EXCLUDE` de PostgreSQL para evitar solapamiento temporal. El esquema depende por ahora solo de la lógica del controlador, lo cual es un riesgo grave para la concurrencia.

---

## 2. Inconsistencias Conocidas y Normalización

Se han detectado múltiples inconsistencias en el *Informe telematicos.md* entre el alcance general, el Product Backlog y el plan de Sprints. A partir de este momento, **el Product Backlog normalizado será la única fuente de verdad**.

### 2.1. Tabla de Equivalencias de IDs (Plan de Sprints → Backlog Real)

La tabla de asignación de sprints tenía errores de numeración (desplazamientos de +1 o -1). Esta es la correspondencia oficial que usaremos:

| Sprint | Épica | Título en el Plan de Sprints | → ID Real (Backlog Normalizado) |
| :--- | :--- | :--- | :--- |
| **Sp 1** | Búsqueda | Filtrar laboratorios por capacidad... (Decía HU-15) | **HU-14: Filtrado avanzado** |
| **Sp 2** | Reservas | Enviar solicitud de reserva... (Decía HU-14) | **HU-15: Solicitud de Reserva** |
| **Sp 2** | Reservas | Ver lista pendientes... (Decía HU-15) | **HU-16: Bandeja Pendientes** |
| **Sp 2** | Reservas | Aprobar o rechazar... (Decía HU-16) | **HU-17: Aprobación Reserva** |
| **Sp 2** | QR | Ver código QR... (Decía HU-21) | **HU-22: Visualización QR** |
| **Sp 2** | QR | Escanear código QR... (Decía HU-22) | **HU-23: Escaneo QR** |
| **Sp 2** | Reportes | Auditoría de asistencias diarias... (Decía HU-24) | **HU-25: Auditoría general** |
| **Sp 2** | Labs | Modificar info del lab... (Decía HU-08) | **HU-09: Modificación lab** |
| **Sp 2** | Reservas | Notificación de estado... (Decía HU-19) | **HU-20: Notificaciones estado** |
| **Sp 3** | Labs | Reporte mantenimiento... (Decía HU-10) | **HU-11: Mantenimiento** |
| **Sp 3** | Labs | Estado operativo equipamiento... (Decía HU-09) | **HU-10: Estado operativo** |
| **Sp 3** | Reservas | Cancelar reserva propia... (Decía HU-17) | **HU-18: Cancelación voluntaria** |
| **Sp 3** | Reservas | Cancelar fuerza mayor... (Decía HU-18) | **HU-19: Cancelación forzosa** |
| **Sp 3** | QR | Cancelación automática inasistencia... (Decía HU-23)| **HU-24: Cancelación por inasistencia** |
| **Sp 3** | Seguridad | Historial de accesos... (Decía HU-04) | **HU-05: Historial sesiones** |
| **Sp 3** | Seguridad | Actualizar perfil... (Decía HU-03) | **HU-04: Actualización perfil** |
| **Sp 3** | Reservas | Historial reservas pasadas... (Decía HU-20) | **HU-21: Historial personal** |
| **Sp 3** | Reportes | Dashboard estadísticas... (Decía HU-25) | **HU-26: Dashboard** |
| **Sp 3** | Reportes | Exportar Excel... (Decía HU-26) | **HU-27: Exportación CSV/Excel** |

*Nota:* En el documento original había dos historias llamadas "HU-14". La primera (Calendario) ahora es **HU-13**, y la segunda (Filtrado) es **HU-14**.

### 2.2. Resolución de Contradicciones de Alcance

1. **Auto-registro vs Registro por Admin:** La sección 1.4 dice que el administrador registra cuentas, pero HU-01 exige auto-registro con verificación por correo. **Resolución:** Se respeta la HU-01 (ya implementada en el código actual). El auto-registro es abierto para estudiantes. Los docentes se auto-registran como estudiantes y luego piden elevación de privilegios (HU-02).
2. **Rol del Auxiliar:** El informe lo menciona, pero no le da HUs propias de gestión de labs. **Resolución:** El Auxiliar tendrá permisos equivalentes al Docente para solicitar laboratorios (HU-15) y permisos para Escanear el QR en la puerta (HU-23), pero no podrá aprobar reservas (eso es del Responsable/Admin).
3. **Criterios truncados / faltantes [PROPUESTO]:**
   - **HU-10 (Cambiar estado):** "Dado que se modifica el estado general del laboratorio, cuando la base de datos registra el cambio, entonces el sistema debe guardar silenciosamente el correo..." (Faltaba "en la tabla de auditoría").
   - **HU-16 (Bandeja):** Falta paginación explícita (Se limitará a 15 por página).
   - **HU-17 (Aprobación):** Faltaba el manejo de QR. Al aprobar, se debe generar y guardar automáticamente el hash del token QR.

---

## 3. Matriz RBAC (Role-Based Access Control)

| Recurso / Módulo | Estudiante | Docente | Auxiliar | Responsable Lab | Administrador |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Labs (Ver Catálogo)** | ✔ Leer | ✔ Leer | ✔ Leer | ✔ Leer | ✔ CRUD Total |
| **Horarios / Calendario**| ✔ Leer | ✔ Leer | ✔ Leer | ✔ Leer | ✔ CRUD Total |
| **Solicitar Reserva** | ✖ Denegado | ✔ Crear | ✔ Crear | ✔ Crear | ✔ Crear |
| **Aprobar / Rechazar** | ✖ Denegado | ✖ Denegado | ✖ Denegado | ✔ Modificar | ✔ Modificar |
| **Ver Código QR Propio**| ✖ Denegado | ✔ Leer (Propio) | ✔ Leer (Propio) | ✔ Leer (Propio) | ✔ Leer (Cualquiera) |
| **Escanear QR (Puerta)**| ✖ Denegado | ✖ Denegado | ✔ Validar | ✔ Validar | ✔ Validar |
| **Mantenimientos** | ✖ Denegado | ✖ Denegado | ✖ Denegado | ✔ Crear | ✔ Crear |
| **Usuarios y Roles** | ✔ Modificar (Perfil) | ✔ Modificar (Perfil) | ✔ Modificar (Perfil) | ✔ Modificar (Perfil) | ✔ CRUD Total |
| **Reportes/Exportación**| ✖ Denegado | ✖ Denegado | ✖ Denegado | ✔ Ver Asistencia | ✔ Total |
