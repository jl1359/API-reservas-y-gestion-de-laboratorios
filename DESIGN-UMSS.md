# LabReserve UMSS — Style Reference
> Diseño moderno, limpio y tecnológico. Inspirado en plataformas de reservas globales (como Airbnb) pero adaptado al contexto académico de la Facultad de Ciencias y Tecnología (UMSS).

**Tema:** Claro (Light) con acentos vibrantes de gradientes tecnológicos.

## Tokens — Colores

| Nombre | Valor HEX | Token de Tailwind | Rol |
|--------|-----------|-------------------|-----|
| UMSS Blue | #1e3a8a | g-blue-900 | Botones principales, encabezados oscuros y logos institucionales. |
| Tech Indigo | #4f46e5 | g-indigo-600 | Color primario para el gradiente del Hero. |
| Bright Blue | #3b82f6 | g-blue-500 | Color secundario para el gradiente del Hero y estados "hover". |
| Warm Gold | #f59e0b | 	ext-amber-500 | Acento vibrante para el texto "en minutos" del título principal. |
| Canvas Gray | #f8fafc | g-slate-50 | Fondo general de las páginas fuera del Hero. |
| Paper White | #ffffff | g-white | Superficies de tarjetas, menú de navegación y barra de búsqueda flotante. |
| Text Primary | #0f172a | 	ext-slate-900 | Texto principal, títulos de secciones. |
| Text Muted | #64748b | 	ext-slate-500 | Texto secundario, subtítulos, placeholders en inputs. |

## Tokens — Tipografía

**Fuente Principal:** Inter (Sans-serif geométrica, súper legible, ideal para UI de software).
**Fuente de Títulos:** Poppins o Montserrat (Para darle fuerza y peso a los encabezados).

| Rol | Tamaño | Peso | Line Height |
|-----|--------|------|-------------|
| Display Hero | 48px - 64px | ExtraBold (800) | 1.1 |
| Subtítulo Hero | 18px - 20px | Normal (400) | 1.5 |
| Nav Links | 16px | Medium (500) | 1.5 |
| Input Labels | 12px | Bold (700) | 1.2 |

## Superficies y Sombras (Elevación)

- **Tarjetas Base (Cards):** g-white rounded-2xl shadow-sm border border-slate-100
- **Barra de Búsqueda Flotante:** g-white rounded-3xl shadow-xl shadow-indigo-900/10 (Debe resaltar sobre el fondo azul).
- **Botones Primarios:** g-blue-900 text-white rounded-full px-6 py-2 shadow-md hover:bg-blue-800 transition-all

## Componentes Clave (Guía Visual)

### 1. Hero Background (Fondo principal)
Debe usar un gradiente radial o lineal que vaya de un morado profundo a un azul brillante.
Clase sugerida: g-gradient-to-br from-indigo-700 via-blue-600 to-blue-500

### 2. Floating Search Bar (Buscador)
Caja blanca ancha con order-radius: 24px. Dividida en 4 columnas separadas por un borde gris sutil (order-r border-slate-200).
Cada sección tiene un "Eyebrow label" (ej. FECHA) en color slate-400, tamaño minúsculo y en mayúsculas, y debajo el valor a seleccionar en slate-900 grueso.

### 3. Top Navigation Bar (Navbar)
Fondo blanco puro (g-white), fijo en la parte superior. Logo a la izquierda. Links centrados (	ext-slate-600 hover:text-blue-600). Botón de "Iniciar sesión" a la derecha, sólido y redondeado.