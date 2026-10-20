# Vibe CRM — Design System (`design.md`)

> Especificación portable para usar con cualquier IA o agente (Claude, Cursor, Copilot, v0, etc.).
> Pega o adjunta este archivo y pide construir pantallas "siguiendo el design system de Vibe CRM".
> **Stack objetivo:** React + Tailwind CSS v4, móvil-primero, PWA. **Idioma de UI:** español.

---

## 1. Principios

Vibe CRM es un CRM para un pequeño negocio de ventas digitales. Dos usuarios:
- **Marta**, dueña, ~45, poco técnica → necesita claridad, tamaños cómodos, cero ambigüedad.
- **Carlos**, ventas, ~28, intensivo en móvil → necesita velocidad y ver mucho de un vistazo.

Personalidad: **profesional, confiable y enérgico**. ADN visual inspirado en **Stripe, Attio y Linear**: preciso, mucho aire, tipografía impecable, color contenido.

Reglas rectoras (en caso de duda, prioriza en este orden):
1. **Solidez y confianza** por encima de todo.
2. **Simplicidad y legibilidad** — una idea principal por pantalla.
3. **Velocidad** — interacciones rápidas, sin fricción.

Mantras de diseño:
- El verde se gana su lugar: **acciones primarias, estado activo y foco**. Nunca como relleno decorativo.
- **Una sola acción primaria por vista.**
- Separa con **bordes finos de 1px + sombras muy sutiles**, no con sombras marcadas.
- Fondo gris claro + tarjetas blancas = la base de toda composición.
- Cifras siempre en **mono tabular**, alineadas a la derecha.

---

## 2. Color

Usa SIEMPRE los **tokens semánticos**. Las escalas crudas existen solo para construir los semánticos o para gráficos.

### Tokens semánticos — modo claro

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#16A34A` | Acción primaria, activo, foco |
| `--color-primary-hover` | `#15803D` | Hover de primario |
| `--color-primary-active` | `#166534` | Pressed de primario |
| `--color-primary-subtle` | `#F0FDF4` | Fondo suave (avatar, chip activo) |
| `--color-on-primary` | `#FFFFFF` | Texto/icono sobre primario |
| `--color-bg` | `#F7F8F9` | Lienzo de la app |
| `--color-surface` | `#FFFFFF` | Tarjetas, superficies |
| `--color-surface-2` | `#F1F2F4` | Superficie hundida, inputs, hover |
| `--color-border` | `#E8EAED` | Borde 1px por defecto |
| `--color-border-strong` | `#D8DBDF` | Borde de inputs/controles |
| `--color-text` | `#1A1D21` | Texto principal |
| `--color-text-muted` | `#656C75` | Texto secundario |
| `--color-text-subtle` | `#868D96` | Texto terciario, placeholders |
| `--color-focus` | `#16A34A` | Anillo de foco |

### Semánticos de estado (par fg / bg / text)

| Estado | `*` (fg) | `*-bg` | `*-text` |
|---|---|---|---|
| success | `#15803D` | `#ECFDF3` | `#166534` |
| warning | `#B45309` | `#FFFBEB` | `#92400E` |
| error | `#DC2626` | `#FEF2F2` | `#991B1B` |
| info | `#2563EB` | `#EFF6FF` | `#1E40AF` |

### Modo oscuro (redefine solo los semánticos)

| Token | Valor |
|---|---|
| `--color-primary` | `#22C55E` |
| `--color-primary-hover` | `#4ADE80` |
| `--color-primary-active` | `#86EFAC` |
| `--color-primary-subtle` | `rgba(34,197,94,.14)` |
| `--color-on-primary` | `#052E16` |
| `--color-bg` | `#0E0F11` |
| `--color-surface` | `#16181B` |
| `--color-surface-2` | `#1C1F23` |
| `--color-border` | `#2A2E33` |
| `--color-border-strong` | `#3A3F45` |
| `--color-text` | `#ECEDEE` |
| `--color-text-muted` | `#9BA1A8` |
| `--color-text-subtle` | `#71777E` |
| success / warning / error / info (fg) | `#4ADE80` / `#FBBF24` / `#F87171` / `#60A5FA` |

Activación del modo oscuro: atributo `data-theme="dark"` en la raíz (`<html>` o contenedor).

### Escalas crudas

**Verde:** 50 `#F0FDF4` · 100 `#DCFCE7` · 200 `#BBF7D0` · 300 `#86EFAC` · 400 `#4ADE80` · 500 `#22C55E` · **600 `#16A34A` (primario)** · 700 `#15803D` · 800 `#166534` · 900 `#14532D` · 950 `#052E16`

**Neutros (fríos):** 0 `#FFFFFF` · 50 `#F7F8F9` · 100 `#F1F2F4` · 200 `#E8EAED` · 300 `#D8DBDF` · 400 `#B0B5BC` · 500 `#868D96` · 600 `#656C75` · 700 `#4A5159` · 800 `#2E3338` · 900 `#1A1D21` · 950 `#0E0F11`

---

## 3. Tipografía

- **Sans (todo el texto):** `Inter`, fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Mono tabular (cifras, importes, datos en tablas):** `JetBrains Mono`, fallback `ui-monospace, "SF Mono", Menlo, monospace`. Usar `font-variant-numeric: tabular-nums` y alinear a la derecha.
- **Pesos:** 400 cuerpo · 500 etiquetas/énfasis · 600 títulos. **Evitar 700.**
- **Tracking:** `-0.011em` en títulos y texto general.

### Escala (equilibrada)

| Token | px / rem | Peso típico | Uso |
|---|---|---|---|
| `--text-4xl` | 36 / 2.25rem | 600 | Título de página |
| `--text-3xl` | 30 / 1.875rem | 600 | Encabezado de sección grande |
| `--text-2xl` | 24 / 1.5rem | 600 | Encabezado |
| `--text-xl` | 20 / 1.25rem | 600 | Título de tarjeta |
| `--text-lg` | 18 / 1.125rem | 500 | Subtítulo / etiqueta grande |
| `--text-base` | 16 / 1rem | 400 | Cuerpo (base móvil) |
| `--text-sm` | 14 / 0.875rem | 400 | Texto secundario |
| `--text-xs` | 12 / 0.75rem | 500 | Etiqueta menor (mayúsculas, tracking .06em) |

`line-height`: 1.2 títulos · 1.5 cuerpo. Nunca texto < 14px en móvil para contenido legible (12px solo etiquetas).

---

## 4. Espaciado, layout y forma

- **Escala base 8px:** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64. Todo padding/margin/gap es múltiplo de la escala.
- **Layout con flex/grid + `gap`**, no márgenes sueltos.
- **Ancho máximo de contenido:** 1200px, centrado en escritorio.
- **Breakpoints (Tailwind):** sm 640 · md 768 · lg 1024 · xl 1280.
- **Radios:** `sm 4px` · `md 6px` (general) · `lg 8px` · `xl 10px` (tarjetas/modales) · `2xl 16px` · `full 9999px` (pills, avatares).
- **Sombras (muy sutiles):**
  - `--shadow-xs`: `0 1px 2px rgba(16,24,32,.04)`
  - `--shadow-sm`: `0 1px 2px rgba(16,24,32,.06), 0 1px 3px rgba(16,24,32,.05)`
  - `--shadow-md`: `0 2px 4px rgba(16,24,32,.05), 0 4px 12px rgba(16,24,32,.06)`
  - `--shadow-lg`: `0 8px 24px rgba(16,24,32,.10)`
- **Bordes:** 1px `--color-border` como recurso principal de separación.

### Navegación

- **Móvil:** tab bar inferior fija de **5 ítems** (Inicio · Contactos · Ventas · Informes · Más). Si hay más destinos, el 5º ("Más") abre una hoja con el resto. Altura ~64px, cada ítem ≥56px de alto táctil.
- **Escritorio:** barra lateral o superior; contenido centrado a 1200px.

---

## 5. Densidad e interacción

- **Densidad adaptativa:** cómoda en móvil, compacta en tablas de escritorio.
- **Altura de controles:** **48px** por defecto (móvil), 44px compacto (escritorio/tablas).
- **Área táctil mínima:** **44×44px**.
- **Microinteracciones:** rápidas y sutiles — `transition` 150ms con `cubic-bezier(0.2,0,0,1)`. Sin rebotes ni animaciones largas.

### Estados (documenta TODOS en cada componente interactivo)

| Estado | Tratamiento |
|---|---|
| Reposo | Estilo base |
| Hover | Oscurece primario (`-hover`) / fondo `surface-2` en secundarios |
| Focus | Anillo verde 2px con separación: `box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-focus)` |
| Activo/pressed | `-active` + `translateY(1px)` opcional |
| Deshabilitado | Fondo `surface-2`, texto `subtle`, `cursor:not-allowed`, sin sombra |
| Error | Borde `--color-error` + halo `0 0 0 3px var(--color-error-bg)` + mensaje con icono |
| Cargando | Spinner (borde girando) o skeleton con `pulse`; deshabilita interacción |
| Seleccionado | Fondo `surface-2` o `primary-subtle`, marca textual/icono |
| Vacío | Icono en cuadro `surface-2`, título, una línea de ayuda y CTA primario |

---

## 6. Accesibilidad

- Contraste mínimo **WCAG AA** (4.5:1 texto normal, 3:1 texto grande).
- Foco **siempre visible** con el anillo verde de 2px.
- Área táctil ≥44px. Etiquetas asociadas a inputs. Estados de error con texto + icono, no solo color.

---

## 7. Iconografía

- **Lucide** (https://lucide.dev), trazo **1.5px**, tamaños 16 / 20 / 24px, `stroke="currentColor"`.
- Interfaz **data-first**: casi sin imágenes. Avatares de **iniciales** sobre `primary-subtle`. Sin emoji.

---

## 8. Componentes (especificaciones)

Alturas: control 48px (móvil) / 44px (compacto). Radio general 6px.

### Botón
- **Primario:** `background:--color-primary; color:--color-on-primary; border:none; radius:6px; font-weight:600; font-size:15px; height:48px; padding:0 20px`. Hover `-hover`, activo `-active`, focus anillo, deshabilitado fondo `surface-2`+texto `subtle`+borde `border`, cargando con spinner 16px.
- **Secundario:** `background:--color-surface; border:1px solid --color-border-strong; color:--color-text; font-weight:500`. Hover fondo `surface-2`.
- **Fantasma (ghost):** transparente, `color:--color-text-muted`. Hover fondo `surface-2`.
- **Destructivo:** `background:--color-error; color:#fff; font-weight:600`. Hover `brightness(.9)`.
- **Icono:** cuadrado 48×48 (o 44), mismas variantes.

### Input / campo
`height:48px; padding:0 14px; border:1px solid --color-border-strong; radius:6px; background:--color-surface; font-size:15px`. Label 14px/500 encima. Focus borde `--color-primary` + anillo. Error borde `--color-error` + halo `error-bg` + mensaje 13px `error-text` con icono. Con icono: padding-left 40px, icono `subtle` a 14px. Deshabilitado fondo `surface-2`.

### Tarjeta
`background:--color-surface; border:1px solid --color-border; radius:10px; box-shadow:--shadow-xs`. Padding 20px. Cabecera con título 15px/600 y acción opcional en `--color-primary`.

### Badge / pill de estado
`radius:9999px; padding:5px 12px; font-size:13px; font-weight:500`. Punto de 7px del color `fg`. Pares: Ganado=success · Pendiente=warning · Perdido=error · Nuevo lead=info · En negociación=primary-subtle/primary · Borrador=neutral (surface-2 + borde).

### Avatar
Círculo 40px (`full`), `background:--color-primary-subtle; color:--color-primary; font-weight:600; font-size:14px`, iniciales. Variante neutra: `surface-2` + `text-muted`.

### Lista
Filas con `padding:14px 18px`, separadas por borde 1px. Avatar + (nombre 15px/500 · empresa 13px muted) + importe mono a la derecha. Fila seleccionada: fondo `surface-2`.

### Tab bar (móvil)
Contenedor `surface`, borde superior 1px, 5 ítems en flex. Ítem: icono 22px + label 11px. Activo `--color-primary`/600; inactivo `--color-text-subtle`/500. Cada ítem ≥56px alto.

### KPI / métrica
Tarjeta con etiqueta 13px muted + cifra mono 30px/500 tabular + delta en pill (success/error).

### Estados de carga y vacío
Skeleton: bloques `surface-2` con `@keyframes` pulse (opacity 1↔.45, 1.4s). Spinner: borde 3px `surface-2` con `border-top-color:--color-primary`, `@keyframes spin .7s linear infinite`. Vacío: icono Lucide en cuadro `surface-2` 48px + título 15px/600 + ayuda 13px muted + CTA primario.

---

## 9. Snippet de tokens (CSS)

```css
:root{
  --color-primary:#16A34A;--color-primary-hover:#15803D;--color-primary-active:#166534;
  --color-primary-subtle:#F0FDF4;--color-on-primary:#fff;
  --color-bg:#F7F8F9;--color-surface:#fff;--color-surface-2:#F1F2F4;
  --color-border:#E8EAED;--color-border-strong:#D8DBDF;
  --color-text:#1A1D21;--color-text-muted:#656C75;--color-text-subtle:#868D96;
  --color-focus:#16A34A;
  --color-success:#15803D;--color-success-bg:#ECFDF3;--color-success-text:#166534;
  --color-warning:#B45309;--color-warning-bg:#FFFBEB;--color-warning-text:#92400E;
  --color-error:#DC2626;--color-error-bg:#FEF2F2;--color-error-text:#991B1B;
  --color-info:#2563EB;--color-info-bg:#EFF6FF;--color-info-text:#1E40AF;
  --shadow-xs:0 1px 2px rgba(16,24,32,.04);
  --shadow-sm:0 1px 2px rgba(16,24,32,.06),0 1px 3px rgba(16,24,32,.05);
  --shadow-md:0 2px 4px rgba(16,24,32,.05),0 4px 12px rgba(16,24,32,.06);
  --shadow-lg:0 8px 24px rgba(16,24,32,.10);
}
[data-theme="dark"]{
  --color-primary:#22C55E;--color-primary-hover:#4ADE80;--color-primary-active:#86EFAC;
  --color-primary-subtle:rgba(34,197,94,.14);--color-on-primary:#052E16;
  --color-bg:#0E0F11;--color-surface:#16181B;--color-surface-2:#1C1F23;
  --color-border:#2A2E33;--color-border-strong:#3A3F45;
  --color-text:#ECEDEE;--color-text-muted:#9BA1A8;--color-text-subtle:#71777E;
  --color-focus:#4ADE80;
  --color-success:#4ADE80;--color-success-bg:rgba(34,197,94,.14);--color-success-text:#86EFAC;
  --color-warning:#FBBF24;--color-warning-bg:rgba(217,119,6,.16);--color-warning-text:#FCD34D;
  --color-error:#F87171;--color-error-bg:rgba(220,38,38,.16);--color-error-text:#FCA5A5;
  --color-info:#60A5FA;--color-info-bg:rgba(37,99,235,.18);--color-info-text:#93C5FD;
}
```

Fuentes: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`

---

## 10. Checklist al crear una pantalla

- [ ] Fondo `--color-bg`, contenido en tarjetas `--color-surface` con borde 1px.
- [ ] Una sola acción primaria (botón verde).
- [ ] Cifras en mono tabular alineadas a la derecha.
- [ ] Controles de 48px, área táctil ≥44px.
- [ ] Foco verde visible en todo elemento interactivo.
- [ ] Estados cubiertos: hover, focus, activo, deshabilitado, error, cargando, vacío, seleccionado.
- [ ] Contraste AA en modo claro y oscuro.
- [ ] Iconos Lucide 1.5px; sin emoji; avatares de iniciales.
- [ ] Espaciado en múltiplos de 8px; radios 6/10px; sombras sutiles.
- [ ] En móvil, navegación en tab bar inferior de 5 ítems.
