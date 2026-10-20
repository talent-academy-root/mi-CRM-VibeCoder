# Handoff: Vibe CRM — App Shell + MVP (PWA, móvil-primero)

## Overview
CRM web responsive (PWA) en español para un pequeño negocio de venta digital. Mobile-first.
Cubre el MVP completo: alta rápida de cliente, ficha con historial, buscador, registro de
ventas/oportunidades, registro de interacciones, seguimientos con recordatorio (vía "Tareas del
día") y lista de tareas del día. Incluye además: sección de Ventas, gestión de usuarios (solo
Dueña), perfil/mi cuenta y pantalla de inicio de sesión.

Dos usuarios guían el diseño:
- **Marta** (Dueña, ~45, poco técnica) → claridad, tamaños cómodos, cero ambigüedad.
- **Carlos** (Comercial, ~28, uso intensivo en móvil) → velocidad y densidad de información.

## About the Design Files
Los ficheros de este paquete son **referencias de diseño creadas en HTML** (un prototipo que
muestra el aspecto y el comportamiento previstos), **no código de producción para copiar tal
cual**. El prototipo está construido como un "Design Component" propietario (`.dc.html`) que se
apoya en un runtime de previsualización; **no es el patrón que debe portarse**.

La tarea es **recrear estos diseños en el entorno del repositorio destino** (React + Tailwind,
según lo previsto) usando sus patrones y librerías establecidos. El diseño consume un **design
system real** ("Vibe CRM Design System") cuyos tokens y componentes se documentan abajo; en el
repo destino deben mapearse a los componentes equivalentes (o crearse siguiendo estos tokens).

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciado e interacciones son los definitivos,
tomados del Vibe CRM Design System. Recrear la UI con fidelidad usando las librerías/patrones del
codebase, respetando los tokens listados en "Design Tokens".

## Arquitectura de navegación (rutas sugeridas)
La app abre en **Hoy** (Tareas del día). Navegación adaptativa:
- **Móvil (<768px)**: bottom tab bar fija. Tabs: Hoy · Clientes · Ventas · (Equipo, solo Dueña).
- **Escritorio (≥768px)**: sidebar izquierda (240px) + contenido centrado (max-width 860px) sobre
  canvas gris; el FAB se convierte en botón primario en la barra superior.

Árbol de rutas propuesto (el prototipo usa un router por estado; en el repo conviene rutas reales):
```
/login                         Inicio de sesión (si no hay sesión)
/                              → redirige a /hoy
/hoy                           Tareas del día (pantalla inicial)
/clientes                      Lista de clientes (buscador + FAB)
/clientes/:id                  Ficha de cliente (push; oculta bottom bar; botón atrás)
/ventas                        Ventas y oportunidades
/equipo                        Gestión de usuarios (solo rol "propietaria")
/cuenta                        Perfil / Mi cuenta
```
Formularios como **overlays** (no rutas completas): bottom sheet en móvil / modal centrado en
escritorio. Cierran con botón, scrim, swipe o **Esc**, con foco atrapado (`role="dialog"`,
`aria-modal`). Overlays: nuevo/editar cliente, nueva tarea, registrar interacción, registrar
venta, programar seguimiento, añadir/editar usuario, confirmaciones de borrado y cierre de sesión.

Transiciones: 150ms `cubic-bezier(0.2,0,0,1)`. Tab↔tab cross-fade; lista→ficha push horizontal;
overlay sube desde abajo (móvil) / fade+scale (escritorio) sobre scrim `rgba(16,24,32,.45)`.

## Screens / Views

### 1. Inicio de sesión (`/login`)
- **Propósito**: autenticar; tras entrar redirige a Hoy y deja al usuario identificado (autoría
  de interacciones/ventas y responsable por defecto de seguimientos).
- **Layout**: centrado, columna max-width 400px. Logo placeholder (cuadro verde 34px, radio 9px,
  letra "V" + "Vibe CRM"). Tarjeta blanca con título "Inicia sesión", subtítulo, formulario.
- **Componentes**: Input Email (`type=email`, `autocomplete=email`, autofocus), Input Contraseña
  (`autocomplete=current-password`) con botón mostrar/ocultar (icono eye/eye-off, `aria-pressed`),
  botón "Entrar" ancho completo (con spinner al cargar, deshabilitado mientras carga), enlace
  "¿Olvidaste tu contraseña?".
- **Estados**: validación inline (email válido + contraseña no vacía), error de credenciales
  (banner rojo `role="alert"`), cargando (~700ms simulados).
- **Auth provider**: aislado y marcado como PUNTO DE INTEGRACIÓN (`signIn`/`signOut`/`getSession`/
  `updateProfile`/`changePassword`). En el prototipo es un mock con persistencia en `localStorage`
  (`vibecrm_session`). Sustituir por Supabase/Firebase/API propia.

### 2. Tareas del día — Hoy (`/hoy`, pantalla inicial) — F9
- **Propósito**: a quién contactar hoy de un vistazo; con lo que Carlos arranca cada mañana.
- **Layout**: cabecera (eyebrow fecha en mayúsculas + h1 "N seguimientos/tareas pendientes"). Debajo,
  un **panel de acciones rápidas** en rejilla (4 columnas escritorio / 2×2 móvil): tiles uniformes
  con icono en círculo + etiqueta — **Nueva tarea** (destacada, icono verde sólido, acción
  principal), **Anotar interacción**, **Registrar venta** y **Nuevo cliente** (icono en verde
  suave). Cada tile abre su overlay correspondiente (los de interacción/venta/cliente con selector
  de cliente, ya que se abren fuera de una ficha). Debajo, las secciones de seguimientos.
- **Secciones**: **Atrasados** (resaltada arriba: borde/acento de error) → **Para hoy** →
  **Próximas**. Cada sección es una tarjeta con cabecera (punto de color + título + contador).
- **Item de seguimiento**: checkbox redondo "Hecho" (22-24px), nombre del cliente (con chip de
  estado del cliente) + qué hay que hacer, avatar de iniciales del responsable, y a la derecha la
  fecha relativa (roja si atrasado). Tocar el item → ficha del cliente. Marcar hecho = optimista +
  toast "Seguimiento completado" con **Deshacer**.
- **Estado vacío**: "No hay seguimientos para hoy" + acción "Nueva tarea".

### 3. Lista de clientes (`/clientes`) — F3, da paso a F1/F2
- **Propósito**: encontrar y abrir clientes; crear nuevos.
- **Layout**: search bar arriba (icono lupa, botón limpiar "X" cuando hay texto), eyebrow
  ("N CLIENTES" / "N RESULTADOS"), lista en tarjeta `padding:0`. FAB "+" (móvil, abajo-derecha) /
  botón "Nuevo cliente" (escritorio, barra superior).
- **Item de cliente**: avatar de iniciales, nombre + dato de referencia ("Último contacto: Hoy /
  Ayer / Hace N días / Hace N semanas"), chip de estado. Tocar → ficha.
- **Búsqueda en vivo**: por nombre, email o **teléfono** (el teléfono normaliza espacios/símbolos).
- **Estados**: cargando (6 skeletons al entrar a la pestaña, ~750ms), sin resultados (icono lupa +
  "Limpiar búsqueda"), sin clientes (icono usuarios + "Añadir cliente").

### 4. Ficha de cliente (`/clientes/:id`) — F2; punto de entrada de F5/F7/F8
- **Propósito**: ver quién es y qué se habló; actuar.
- **Cabecera (tarjeta)**: avatar, nombre, empresa, chip de estado; chip "Origen: <canal>" si hay;
  filas tappables Teléfono (`tel:`) y Email (`mailto:`). Botón "Editar" en la barra superior.
- **Acciones rápidas** (abren overlay): "Anotar interacción" (F7), "Programar seguimiento" (F8),
  "Registrar venta" (F5). En escritorio se muestran como 3 botones-tarjeta en fila; en móvil en
  columna.
- **Seguimientos pendientes**: items con checkbox Hecho, acción, sub (vence/atrasado), avatar del
  responsable y chip Atrasado/Pendiente.
- **Historial** (cronológico, más reciente primero): combina **interacciones** (icono por canal +
  nota + "Registrado por <autor>"), **ventas** (icono trending + concepto + chip de estado +
  importe en verde + "Registrado por <autor>") y **seguimientos completados** (icono check +
  "Seguimiento completado" + "Responsable: <nombre>"). Estado vacío "Sin actividad todavía".

### 5. Nuevo / Editar cliente (overlay) — F1
- **Campos**: Nombre (obligatorio), Empresa (opcional), Teléfono (`type=tel`), Email (`type=email`),
  Canal de origen (chips opcionales: Web/Redes/Email/WhatsApp), Nota (opcional).
- **Validación**: nombre requerido **y** al menos un medio de contacto (teléfono o email).
- **Guardar** (F1): crea el cliente y **abre su ficha** directamente; toast "Cliente añadido".
- Teclados adecuados por campo (tel/email). Editar precarga los datos.

### 6. Nueva tarea (overlay)
- **Campos**: Título; **Cliente = desplegable** de clientes existentes con botón "+ Nuevo cliente"
  que abre el alta y, al guardar, **vuelve a la tarea** con ese cliente preseleccionado; Fecha
  (date). Validación de título y cliente. Crea un seguimiento (aparece en Hoy y en la ficha).

### 7. Registrar interacción (overlay) — F7
- **Campos**: Cliente (desplegable; solo cuando se abre fuera de una ficha, p. ej. desde Hoy),
  Canal segmentado (Llamada/Email/WhatsApp/En persona), Fecha (por defecto hoy), Nota (textarea,
  autofocus). Autor automático = usuario actual ("Se registrará como <nombre>").
- **Guardar** (optimista): añade al historial, actualiza "último contacto"; toast "Interacción
  registrada".

### 8. Registrar venta u oportunidad (overlay) — F5
- **Campos**: Cliente (desplegable; solo fuera de ficha, p. ej. desde la sección Ventas), Qué se
  vende, Importe (€, teclado numérico), Estado segmentado (Oportunidad abierta / Ganada / Perdida),
  Fecha (por defecto hoy).
- **Validación**: concepto requerido e importe > 0.
- **Guardar** (optimista): añade al historial con su chip de estado, importe y autor; toast.

### 9. Programar seguimiento (overlay) — F8
- **Campos**: Qué hay que hacer, Fecha (date, requerida), Responsable segmentado (usuarios; por
  defecto el actual). Estado inicial pendiente.
- **Guardar**: crea el seguimiento → aparece en Tareas del día (en su fecha: atrasado/hoy/próximo)
  y en pendientes de la ficha; toast "Seguimiento programado". El "recordatorio/aviso" se
  materializa en Tareas del día (atrasados resaltados). Notificaciones push = integración futura.

### 10. Ventas y oportunidades (`/ventas`)
- **Propósito**: ver qué está en marcha y qué se ha cerrado.
- **Layout**: cabecera + botón "Añadir venta" (primary). Dos métricas (grid 2 col): **En marcha**
  (€ pipeline abierto, color info) y **Ganado** (€ cerrado, color success), con subtítulo de
  conteo. Filtro segmentado con contadores: Todas · En marcha · Ganadas · Perdidas. Lista de
  operaciones (concepto + chip estado + cliente; importe mono + fecha a la derecha) → tocar abre la
  ficha del cliente. Estado vacío contextual por filtro.
- "Añadir venta" abre el overlay de venta con selector de cliente. (El mismo alta rápida de venta
  está disponible también desde el panel de acciones rápidas de Hoy.)

### 11. Gestión de usuarios (`/equipo`, solo Dueña) — control de acceso TAL-7
- **Acceso**: visible/accesible solo si `session.user.rol === 'propietaria'` (marcado en código).
  Para otros roles: bloque "Acceso restringido".
- **Lista**: avatar, nombre + email, chip de rol (Dueña / Atiende y vende), acciones Editar y
  Eliminar.
- **Añadir/Editar usuario** (modal): Nombre, Email (validados), Rol segmentado.
- **Eliminar**: diálogo de confirmación (botón destructivo). Reglas: no puedes eliminarte a ti
  misma ni dejar al equipo sin ninguna Dueña (sin botón eliminar en esos casos).

### 12. Perfil / Mi cuenta (`/cuenta`)
- **Cabecera**: avatar, nombre y chip de rol del usuario actual.
- **Opciones**: "Editar mis datos" (modal Nombre/Email), "Cambiar contraseña" (modal actual/nueva/
  repetir, validado, mínimo 6).
- **Cerrar sesión** con diálogo de confirmación → vuelve al login. Puntos de integración del auth
  provider marcados (`updateProfile`, `changePassword`).

## Interactions & Behavior
- **Navegación**: tabs persistentes (Hoy/Clientes/Ventas/Equipo); ficha = push con botón atrás;
  formularios = overlays que preservan la pantalla de fondo.
- **Optimista + toast**: todas las altas (cliente, interacción, venta, seguimiento, tarea) aplican
  al instante y muestran un toast; "Seguimiento completado" incluye Deshacer (~3.8s).
- **Accesibilidad**: overlays con `role="dialog"`, `aria-modal`, foco inicial en el primer campo,
  **foco atrapado** (Tab/Shift+Tab cicla), cierre con **Esc**/scrim/botón. `aria-label` en botones
  de icono. Hit targets ≥44px. Inputs con label asociada, ring de foco verde visible.
- **Responsive**: bottom tabs ↔ sidebar a 768px; contenido centrado max 860px en escritorio; FAB ↔
  botón primario.
- **Animaciones**: 150ms `cubic-bezier(0.2,0,0,1)`; carga = skeleton pulse o spinner fino.

## State Management
Estado principal (en el prototipo, en un único componente; en el repo, repartir en store/rutas):
- `session` (usuario actual; persistido en localStorage), `tab`, `detailId` (ficha abierta),
  `overlay` (qué formulario/diálogo está abierto), `perfilOpen`.
- Datos: `contacts`, `seguimientos` (campos: id, clienteId, accion, vence, hecho, fechaHecho,
  responsable), `interacciones` (id, clienteId, tipo, texto, fecha, autor), `ventas` (id,
  clienteId, concepto, importe, estado, fecha, autor), `users`.
- Formularios: `form` (cliente), `taskForm`, `interForm`, `ventaForm`, `segForm`, `userForm`,
  `profileForm`, `passForm`; más `query` (buscador), `ventaFilter`, `loadingClientes`, `toast`,
  `triedSave` (para validación tras primer intento).
- **Identidad**: el autor de interacciones/ventas y el responsable por defecto de seguimientos =
  `session.user.name`.

## Design Tokens
El sistema es **Vibe CRM Design System** (inspiración Stripe/Attio/Linear: preciso, mucho aire,
tipografía impecable, color contenido). Usar SIEMPRE tokens semánticos.

- **Color**: canvas gris frío `#F7F8F9`; superficies blancas `#FFFFFF`; verde de marca `#16A34A`
  (green-600) SOLO para acción primaria, activo y foco (hover `-hover` más oscuro; activo
  `-active`). Estados: success/warning/error/info solo en badges, deltas y validación. Borde 1px
  `#E8EAED` (controles `#D8DBDF`). Texto: principal, muted y subtle. Dark mode opt-in vía
  `data-theme="dark"` (verde sube a `#22C55E`, canvas `#0E0F11`) — solo se redefinen tokens
  semánticos.
- **Tipografía**: Inter para todo (pesos 400/500/600, evitar 700); **JetBrains Mono**
  (tabular-nums) para toda cifra/importe, alineada a la derecha. Títulos y texto con tracking
  `-0.011em`; eyebrows en MAYÚSCULAS con tracking `.06em`. Móvil: texto base ~15px; h1 24px.
- **Espaciado**: escala base 8px (4·8·12·16·20·24·32·40·48·64). Flex/grid con `gap`, nunca
  márgenes sueltos. Contenido escritorio centrado, max 1200px (en este prototipo 860px).
- **Forma**: radio general 6px; tarjetas y modales 10–12px; pills/avatares full. Inputs/botones
  48px de alto (móvil), 44px (compacto). Sheet móvil radio sup. 16px.
- **Sombras**: muy sutiles, tinte frío `rgba(16,24,32,…)`: xs/sm tarjetas, md popovers, lg
  sheets/modales. Tarjeta = superficie blanca + borde 1px + shadow-xs + padding 20px.
- **Iconografía**: Lucide, trazo 1.5px, `currentColor`, tamaños 16/20/24 (22 en tab bar). Sin
  iconos rellenos, sin emoji. Avatares = iniciales (verde sobre `primary-subtle`, o neutro).
- **Sin** gradientes, texturas, patrones ni blur decorativos. **Sin emoji** en la UI.

## Contenido / idioma
Español (España), sentence case. Botones verbo-primero ("Guardar", "Añadir cliente", "Llamar").
Importes en euros con separador de miles por punto (`€12.400`), mono tabular. Estados de venta:
Oportunidad abierta · Ganada · Perdida. Vacíos/errores: una línea de título + una de ayuda + una
acción. **Sin emoji.**

## Components (del design system a mapear en el repo)
`Button` (variant primary/secondary/ghost; un solo primary por vista), `IconButton` (icon-only,
siempre `aria-label`), `Card` (title + action opcional), `Metric` (KPI: label + cifra mono +
delta), `ListRow` (avatar iniciales + nombre/subtítulo + importe mono + badge), `Input` (label
arriba, helper/error, ring foco verde), `Badge` (pill de estado con dot), `Avatar` (iniciales),
`Skeleton` (pulse), `EmptyState` (icono + título + ayuda + CTA), `TabBar` (bottom nav móvil).
Los `<select>` (desplegables de cliente) y `<textarea>` se estilaron a mano siguiendo los tokens
de Input (alto 48px, borde, radio 6px, ring de foco verde) — en el repo, usar el control
equivalente del design system.

## Assets
Ninguna imagen/foto (interfaz data-first). Iconos = Lucide (path data incluido en el prototipo).
Avatares = iniciales generadas del nombre. Logo = placeholder ("V" en cuadro verde + "Vibe CRM").

## Files
- `CRM Shell.dc.html` — prototipo completo (app shell, navegación, todas las pantallas y
  formularios, datos mock en español). Es un Design Component con runtime de previsualización; usar
  como **referencia de comportamiento y estilo**, no como código a portar literalmente.
- `_ds/vibe-crm-design-system-.../` — design system Vibe CRM: `tokens/` (colors, typography,
  spacing, effects, fonts), `base.css`, `styles.css` y los componentes fuente. Es la fuente de
  verdad de tokens y componentes; mapear a sus equivalentes en el repo destino.
