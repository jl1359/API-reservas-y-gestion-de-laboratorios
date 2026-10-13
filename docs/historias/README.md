# Matriz de Documentación y Trazabilidad de Historias de Usuario

Este directorio contiene la documentación técnica y funcional detallada del desarrollo de cada una de las **27 Historias de Usuario** del proyecto **"API REST para la gestión de servicios universitarios"**, distribuidas a lo largo de los sprints según el Product Backlog normalizado y las decisiones de arquitectura del equipo.

---

## 1. Estructura de Documentación por Historia

Cada historia de usuario documentada en esta serie cuenta con los siguientes apartados estandarizados:
1. **Definición de Historia y Criterios de Aceptación:** Especificación en formato ágil (*Como... Quiero... Para...*) y criterios en formato Gherkin (*Dado que... Cuando... Entonces...*).
2. **Diseño de Endpoints y Contratos API:** Método HTTP, ruta URI, permisos de rol (RBAC), schemas de entrada (validación Zod), códigos de respuesta HTTP y payloads JSON.
3. **Diseño Frontend y Componentes UI:** Vistas React, hooks asociados (`useAuth`, `useLaboratorios`, etc.), gestión de estado y rendimiento según las reglas de `vercel-react-best-practices`.
4. **Modelo de Datos y Persistencia:** Entidades Prisma impactadas, relaciones foráneas, restricciones de integridad y migraciones SQL.
5. **Decisiones Técnicas y Alternativas:** Trade-offs analizados y justificación técnica.
6. **Estrategia y Evidencia de Pruebas:** Pruebas unitarias, pruebas de integración HTTP (Supertest) y pruebas de carga/concurrencia.
7. **Nivel Cognitivo alcanzado (Taxonomía de Bloom):** Justificación del nivel de aprendizaje alcanzado (*Aplicar*, *Analizar*, *Evaluar*, *Crear*).
8. **Estado y Asignación:** Estado actual en el repositorio y responsable técnico.

---

## 2. Índice General de Historias de Usuario

| ID | Épica | Título | Sprint | Responsable | Est. | Nivel Bloom | Documento |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **HU-01** | Seguridad | Registro e Inicio de Sesión | Sprint 1 | José | 5 | Aplicar | [sprint-1.md#hu-01](./sprint-1.md#hu-01) |
| **HU-02** | Seguridad | Gestión y Aprobación de Roles | Sprint 1 | José | 5 | Analizar | [sprint-1.md#hu-02](./sprint-1.md#hu-02) |
| **HU-03** | Seguridad | Restablecimiento de Contraseña | Sprint 1 | José | 4 | Aplicar | [sprint-1.md#hu-03](./sprint-1.md#hu-03) |
| **HU-06** | Laboratorios | Creación de Perfil de Laboratorio | Sprint 1 | Herlan | 5 | Aplicar | [sprint-1.md#hu-06](./sprint-1.md#hu-06) |
| **HU-07** | Laboratorios | Configuración de Días y Horarios | Sprint 1 | Miguel | 7 | Analizar | [sprint-1.md#hu-07](./sprint-1.md#hu-07) |
| **HU-08** | Laboratorios | Vinculación de Equipamiento | Sprint 1 | Herlan | 5 | Aplicar | [sprint-1.md#hu-08](./sprint-1.md#hu-08) |
| **HU-12** | Búsqueda | Catálogo General de Laboratorios | Sprint 1 | Marco | 4 | Aplicar | [sprint-1.md#hu-12](./sprint-1.md#hu-12) |
| **HU-13** | Búsqueda | Calendario Interactivo de Disponibilidad | Sprint 1 | Fernando | 5 | Analizar | [sprint-1.md#hu-13](./sprint-1.md#hu-13) |
| **HU-14** | Búsqueda | Filtrado Avanzado de Laboratorios | Sprint 1 | Andrés | 5 | Analizar | [sprint-1.md#hu-14](./sprint-1.md#hu-14) |
| **HU-15** | Reservas | Solicitud de Reserva de Laboratorio | Sprint 2 | Miguel / José | 8 | **Evaluar** | [sprint-2.md#hu-15](./sprint-2.md#hu-15) |
| **HU-16** | Reservas | Bandeja de Solicitudes Pendientes | Sprint 2 | Herlan | 3 | Analizar | [sprint-2.md#hu-16](./sprint-2.md#hu-16) |
| **HU-17** | Reservas | Aprobación o Rechazo de Reserva | Sprint 2 | Herlan | 5 | **Crear** | [sprint-2.md#hu-17](./sprint-2.md#hu-17) |
| **HU-22** | Asistencia | Visualización de Código QR de Ingreso | Sprint 2 | Fernando | 4 | Aplicar | [sprint-2.md#hu-22](./sprint-2.md#hu-22) |
| **HU-23** | Asistencia | Escaneo y Validación de Código QR | Sprint 2 | Fernando | 5 | **Evaluar** | [sprint-2.md#hu-23](./sprint-2.md#hu-23) |
| **HU-25** | Reportes | Auditoría General de Reservas | Sprint 2 | Andrés | 3 | Analizar | [sprint-2.md#hu-25](./sprint-2.md#hu-25) |
| **HU-09** | Laboratorios | Modificación de Información de Lab | Sprint 2 | Marco | 4 | Aplicar | [sprint-2.md#hu-09](./sprint-2.md#hu-09) |
| **HU-20** | Reservas | Notificaciones de Estado de Solicitud | Sprint 2 | Andrés | 3 | **Crear** | [sprint-2.md#hu-20](./sprint-2.md#hu-20) |
| **HU-10** | Laboratorios | Gestión de Estado Operativo de Lab | Sprint 3 | Marco | 3 | Analizar | [sprint-3.md#hu-10](./sprint-3.md#hu-10) |
| **HU-11** | Laboratorios | Registro de Reporte de Mantenimiento | Sprint 3 | Herlan | 8 | **Crear** | [sprint-3.md#hu-11](./sprint-3.md#hu-11) |
| **HU-18** | Reservas | Cancelación Voluntaria de Reserva | Sprint 3 | José | 3 | Aplicar | [sprint-3.md#hu-18](./sprint-3.md#hu-18) |
| **HU-19** | Reservas | Cancelación Forzosa por Fuerza Mayor | Sprint 3 | José | 3 | Analizar | [sprint-3.md#hu-19](./sprint-3.md#hu-19) |
| **HU-24** | Asistencia | Cancelación Automática por Inasistencia | Sprint 3 | Fernando | 5 | **Crear** | [sprint-3.md#hu-24](./sprint-3.md#hu-24) |
| **HU-04** | Seguridad | Actualización de Información de Perfil | Sprint 3 | Marco | 3 | Aplicar | [sprint-3.md#hu-04](./sprint-3.md#hu-04) |
| **HU-05** | Seguridad | Historial de Accesos y Sesiones | Sprint 3 | Andrés | 4 | Analizar | [sprint-3.md#hu-05](./sprint-3.md#hu-05) |
| **HU-21** | Reservas | Historial de Reservas Personales | Sprint 3 | Fernando | 2 | Aplicar | [sprint-3.md#hu-21](./sprint-3.md#hu-21) |
| **HU-26** | Reportes | Dashboard de Estadísticas de Uso | Sprint 3 | Miguel | 5 | **Evaluar** | [sprint-3.md#hu-26](./sprint-3.md#hu-26) |
| **HU-27** | Reportes | Exportación de Reportes en Excel/CSV | Sprint 3 | Miguel | 3 | Aplicar | [sprint-3.md#hu-27](./sprint-3.md#hu-27) |

---

## 3. Guía de Acceso a los Documentos de Sprint
- **[Sprint 1: Fundamentos, Seguridad y Catálogo](./sprint-1.md):** Contiene el detalle exhaustivo de HU-01 a HU-14.
- **[Sprint 2: Motor de Reservas, Concurrencia y Validación QR](./sprint-2.md):** Contiene el detalle exhaustivo del núcleo transaccional, códigos QR y gestión de notificaciones RESTful (HU-15 a HU-25).
- **[Sprint 3: Casos de Borde, Automatización, Auditoría y Reportes](./sprint-3.md):** Contiene el detalle de mantenimientos, cancelaciones automáticas, sesiones, gráficos y exportaciones (HU-04 a HU-27).
