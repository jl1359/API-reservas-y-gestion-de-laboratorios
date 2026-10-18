# Taxonomía de Bloom aplicada al proyecto

> Material enviado por el docente. Este documento evalúa **si se adecua** al proyecto y **cómo** aplicarla sin forzarla.

## 1. ¿Qué es (versión vigente)?

La **Taxonomía de Bloom revisada** (Anderson y Krathwohl, 2001) clasifica los objetivos de aprendizaje en dos dimensiones:

| Dimensión de proceso cognitivo (de menor a mayor) | Verbos típicos en ingeniería de software |
| :--- | :--- |
| 1. **Recordar** | identificar, listar, nombrar |
| 2. **Comprender** | explicar, describir, clasificar |
| 3. **Aplicar** | implementar, configurar, ejecutar, usar |
| 4. **Analizar** | analizar, diferenciar, descomponer, modelar |
| 5. **Evaluar** | evaluar, validar, verificar, medir, contrastar, justificar |
| 6. **Crear** | diseñar, desarrollar, construir, integrar, planificar |

Dimensión del conocimiento: **factual** (sintaxis, códigos HTTP), **conceptual** (REST, ACID, RBAC), **procedimental** (cómo migrar una BD, cómo escribir un test) y **metacognitivo** (retrospectivas, autoevaluación del equipo).

## 2. ¿Se adecua al proyecto? — **Sí, pero en un lugar concreto**

| Uso | ¿Aplica? | Motivo |
| :--- | :--- | :--- |
| Redactar **objetivo general y específicos** | ✅ Sí, principal | Es su propósito original: objetivos medibles con un verbo observable. El docente probablemente evalúa esto. |
| Mostrar **progresión de aprendizaje** por sprint / HU | ✅ Sí | Evidencia académica: el proyecto sube de *Aplicar* (CRUD) a *Evaluar* (pruebas de concurrencia) y *Crear* (sistema integrado). |
| Rúbrica de **autoevaluación** en la documentación de cada HU | ✅ Sí | Campo "Nivel de Bloom alcanzado" en la plantilla HU. |
| Reemplazar Scrum, el backlog o los criterios de aceptación | ❌ No | Bloom clasifica **aprendizaje**, no requisitos de software. Las HUs siguen en formato *Como/Quiero/Para* y *Dado/Cuando/Entonces*. |

## 3. Problemas detectados en los objetivos actuales del informe (§4 y §5)

| Objetivo actual | Problema según Bloom |
| :--- | :--- |
| 5.1 "**Analizar** los requerimientos… se **definirá** una arquitectura" | Dos niveles mezclados (Analizar + Crear) en un solo objetivo. |
| 5.2 "**Diseñar e implementar** una base de datos…" | Dos verbos; Bloom recomienda **un verbo por objetivo** para que sea evaluable. |
| 5.3 "**Desarrollar** una API… También se implementará…" | Correcto en nivel (Crear), pero sin criterio medible. |
| 5.4 "**Implementar** autenticación… Además se incorporará QR…" | Dos productos en un objetivo. |
| 5.5 "**Integrar**… Finalmente se realizarán pruebas…" | La parte de pruebas es nivel *Evaluar* y merece un objetivo propio. |
| Ninguno | Falta un objetivo de nivel **Evaluar** explícito, que es justamente lo que diferencia el proyecto (concurrencia demostrada). |

## 4. Propuesta de objetivos reescritos (para aprobar antes de cambiar el informe)

**Objetivo general (Crear):**
> **Desarrollar** un servicio telemático centralizado, compuesto por una API REST en Node.js/TypeScript, una base de datos PostgreSQL y un cliente web React, que gestione de forma concurrente la búsqueda, reserva y validación de asistencia de los laboratorios de la UMSS sin permitir reservas superpuestas.

**Objetivos específicos (progresión ascendente):**

| # | Nivel Bloom | Objetivo | Indicador medible | Sprint / HUs |
| :- | :--- | :--- | :--- | :--- |
| OE1 | Analizar | **Analizar** el proceso actual de asignación de laboratorios y los roles involucrados para obtener un Product Backlog priorizado. | 27 HUs con criterios de aceptación y matriz RBAC de 5 roles. | Sprint 0 |
| OE2 | Crear | **Diseñar** el modelo relacional en PostgreSQL con restricciones que garanticen la integridad de horarios y capacidades. | Diagrama ER + migraciones; restricción `EXCLUDE` activa. | Sprint 1-B / 2 |
| OE3 | Aplicar | **Implementar** autenticación JWT y control de acceso basado en roles en todos los endpoints. | 100 % de endpoints protegidos según matriz; tests 401/403. | Sprint 1 |
| OE4 | Crear | **Construir** el motor transaccional de reservas con control de concurrencia y ciclo de vida de estados. | Máquina de estados con 6 estados; transiciones testeadas. | Sprint 2 |
| OE5 | Aplicar | **Implementar** la validación de asistencia mediante códigos QR y la gestión de notificaciones del servicio. | Endpoint REST de escaneo atómico de QR y consulta de notificaciones en < 300 ms. | Sprint 2-3 |
| OE6 | Evaluar | **Evaluar** el comportamiento del sistema bajo solicitudes simultáneas mediante pruebas de carga y de roles. | k6: 50 usuarios → 1 reserva aceptada, resto 409; 0 solapamientos en BD. | Sprint 4 |

## 5. Mapeo HU → nivel de Bloom (para la documentación por HU)

| Nivel | HUs representativas | Evidencia |
| :--- | :--- | :--- |
| Aplicar | HU-01, 03, 04, 06, 08, 09, 12 | CRUD, validaciones, uso de librerías (bcrypt, JWT, multer). |
| Analizar | HU-07, 14, 16, 25 | Reglas de rangos horarios, filtros combinados, consultas de auditoría. |
| Evaluar | HU-15 (concurrencia), 23 (validez QR), 26 (estadísticas) | Pruebas de carga, decisiones sobre ventanas de validez, métricas. |
| Crear | HU-11, 17, 20, 24 + integración final | Procesos automáticos, tiempo real, sistema completo integrado. |

## 6. Recomendación

Adoptar Bloom **en tres puntos del informe**: (1) reescritura de objetivos §4-§5, (2) una subsección breve en *Justificación académica* §3.2 que explique la progresión cognitiva, y (3) el campo "Nivel de Bloom" en cada documento de HU. No usarla en el backlog ni en los criterios de aceptación.

**Referencia:** Anderson, L. W., y Krathwohl, D. R. (Eds.). (2001). *A taxonomy for learning, teaching, and assessing: A revision of Bloom's taxonomy of educational objectives*. Longman.
