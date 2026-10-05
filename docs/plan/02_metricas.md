# Sistema de Métricas del Proyecto

Este documento define los KPI (Indicadores Clave de Rendimiento) y las métricas necesarias para evaluar de manera objetiva el avance, la calidad y la funcionalidad del sistema universitario de laboratorios, alineando el desarrollo con los requisitos de la evaluación académica (Trabajo 1).

## 1. Métricas de Gestión Ágil

| Métrica | Descripción (Qué mide) | Fórmula / Recolección | Meta / Umbral |
| :--- | :--- | :--- | :--- |
| **Velocidad de Sprint** | Puntos de historia completados al finalizar el sprint. | Suma de puntos "Done" en Taiga. | Alcanzar el 90% de los puntos planificados. |
| **Cycle Time** | Tiempo promedio que tarda una tarea desde "En progreso" hasta "Hecho". | Revisión de logs en Taiga / GitHub. | < 4 días por tarea. |
| **Tasa de Completitud HU** | Porcentaje de criterios de aceptación implementados por HU. | Checklists manual en PRs. | 100% de criterios cubiertos para cerrar la HU. |

## 2. Métricas de Calidad de Código y Pruebas

| Métrica | Descripción | Fórmula / Recolección | Meta / Umbral |
| :--- | :--- | :--- | :--- |
| **Cobertura de Pruebas (Test Coverage)** | Porcentaje de líneas lógicas del backend cubiertas por tests automatizados. | Comando: `npm run test:coverage` (Usando Jest). | > 75% Global. > 90% en el módulo Reservas. |
| **Errores Estáticos (Lint/Typing)** | Errores de tipeo sueltos o violaciones de estilo. | Comando: `tsc --noEmit && eslint .` | **0 errores** antes de hacer merge a main. |
| **Densidad de Defectos** | Errores reportados por el profesor o QA por cada 1000 líneas de código. | Conteo de issues en GitHub etiquetados como `bug`. | < 2 bugs críticos por sprint. |

## 3. Métricas de Arquitectura y Seguridad

| Métrica | Descripción | Fórmula / Recolección | Meta / Umbral |
| :--- | :--- | :--- | :--- |
| **Cumplimiento REST** | Endpoints que usan el verbo correcto y retornan JSON con códigos de estado semánticos (200, 201, 400, 404, 500). | Auditoría mediante la colección Postman. | 100% de la API en el estándar REST. |
| **Rutas Segurizadas** | Porcentaje de rutas de la API protegidas por el middleware JWT frente a las expuestas. | Conteo manual en `routes/`. | 100% (excepto login/registro). |
| **Vulnerabilidades de Dependencias**| Amenazas de seguridad en librerías de NPM. | Comando: `npm audit` | 0 vulnerabilidades de criticidad Alta o Crítica. |

## 4. Métricas de Concurrencia e Integridad (Métricas Core)

Estas métricas son el corazón de la calificación del proyecto.

| Métrica | Descripción | Fórmula / Recolección | Meta / Umbral |
| :--- | :--- | :--- | :--- |
| **Solapamiento de Reservas** | Número de reservas en BD que ocupan la misma hora, mismo día, mismo laboratorio y ambas están aprobadas. | Script SQL: `SELECT COUNT(*) FROM reservas ... WHERE solapan` | **0 absoluto**. Es innegociable. |
| **Manejo de Colisiones** | Respuesta del servidor ante peticiones simultáneas por el mismo horario. | Prueba de carga enviando 50 POSTs al mismo ms. | 1 request con 201 (Ok), 49 requests con 409 (Conflicto). |

## 5. Rendimiento y UX

| Métrica | Descripción | Fórmula / Recolección | Meta / Umbral |
| :--- | :--- | :--- | :--- |
| **Latencia P95 del Catálogo**| Tiempo de respuesta para la petición de búsqueda/filtrado de laboratorios. | Herramienta recomendada: `k6` o `autocannon`. | < 300 ms (percentil 95) bajo carga. |
| **Throughput (Rendimiento)** | Solicitudes procesadas por segundo (req/s) bajo prueba de carga simulando 300 estudiantes. | Herramienta: `k6 run carga.js` | Soportar > 150 req/s sin que el CPU del server colapse al 100%. |

---

## 6. Rúbrica de Autoevaluación (Requisito Académico Trabajo 1)

Antes de la entrega (22/09/2026), el equipo debe verificar este checklist de evaluación que será revisado por el tribunal/docente:

- [ ] **Funcionalidad:** El sistema permite el registro completo de usuarios, laboratorios, horarios y el ciclo de vida de una reserva (Aprobación, Escaneo QR, Cancelación, Inasistencia).
- [ ] **Arquitectura:** Existe una separación absoluta Cliente (React) y Servidor (NodeJS). Ninguna vista web es generada por el backend (no PUG ni EJS).
- [ ] **Seguridad:** Ninguna contraseña está en texto plano en la BD. Todas las rutas de administración requieren un token JWT válido de un rol elevado.
- [ ] **Rendimiento y Concurrencia:** La BD impide mediante bloqueos que dos alumnos ganen el mismo laboratorio al mismo milisegundo.
- [ ] **Documentación:** Colección Postman operativa, README explicativo y Modelo DDL subido al repo.

## 7. Comandos Útiles para el Equipo

Para estandarizar la medición de calidad en el equipo, utilicen los siguientes comandos localmente:

```bash
# Revisar errores de TypeScript
npx tsc --noEmit

# Revisar vulnerabilidades
npm audit

# Cargar base de datos desde cero (Prueba de Migraciones)
npx prisma migrate reset

# (Propuesto) Prueba de carga de estrés con Autocannon en local
npx autocannon -c 100 -d 10 -m POST -H "Authorization: Bearer <TOKEN>" -b '{"laboratorioId":1, "fechaInicio":"...", ...}' http://localhost:3000/api/v1/reservas
```
