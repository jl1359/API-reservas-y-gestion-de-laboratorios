# Reporte de validaciones - Andrés

Fecha: 28/10/26, 11:21 a. m. (Bolivia).

Rama: fix/andres-validaciones-20261028151904

Base actualizada: 1759b27847fc0644e104cb998341faca24b3a3ff

## Alcance

Compilación y comprobaciones HTTP locales, ejecutadas con Node.js v24.14.1 en win32. El restablecimiento se comprobó con un servicio simulado para no usar la base de datos ni cambiar contraseñas. No se utilizaron cuentas reales ni se enviaron correos, reservas o QR.

## Correcciones

- El formulario de restablecimiento envía newPassword, como espera el controlador.
- La configuración CORS deja de autorizar los orígenes fuera de la lista configurada.

## Resultados

Backend y frontend: npm ci y npm run build finalizados sin errores.

15 comprobaciones: 14 conformes, 1 parcial(es), 0 fallo(s).

| Caso | Comprobación | Resultado |
|---|---|---|
| T01 | Estado de la API | Conforme |
| T02 | Inicio de sesión vacío | Conforme |
| T03 | Correo numérico en login | Conforme |
| T04 | Registro vacío | Conforme |
| T05 | Recuperación sin correo | Conforme |
| T06 | Reporte de asistencias sin token | Conforme |
| T07 | Reporte con token inválido | Conforme |
| T08 | Usuarios sin token | Conforme |
| T09 | Reservas sin token | Conforme |
| T10 | Restablecimiento: contrato del formulario y controlador (servicio simulado) | Conforme |
| T11 | Restablecimiento: rechazo de cuerpo con campo incorrecto | Conforme |
| T12 | CORS permite el origen configurado | Conforme |
| T13 | CORS no autoriza un origen ajeno | Conforme |
| T14 | Cabeceras de protección de la API | Conforme |
| T15 | Limitador presente; criterio de cinco fallos pendiente | Parcial |

## Dependencias

npm audit: 5 paquetes señalados (1 críticos, 2 altos, 2 moderados, 0 bajos). Son alertas de dependencias, sin verificación de explotación. No se actualizaron automáticamente.

## Pendientes

- Confirmar el criterio vigente de intentos fallidos: el limitador probado no certifica el bloqueo tras cinco contraseñas incorrectas del documento de Sprint 1.
- Verificar registro y activación por correo, login con una cuenta real y recuperación completa con enlace válido.
- Probar PostgreSQL, reservas, conflictos de horario, roles, lectura de QR y reporte diario con datos reales autorizados.
- La meta grupal de más de 200 reservas no se verificó.
- Revisar actualizaciones de dependencias y mejorar el mensaje de registro inválido en español.

## Reproducir las pruebas técnicas

Desde backend, después de npm run build:

```text
node scripts/qa-auth-cors-andres.cjs
```

Estas pruebas acreditan controles técnicos concretos y no certifican el sistema completo ni su despliegue.
