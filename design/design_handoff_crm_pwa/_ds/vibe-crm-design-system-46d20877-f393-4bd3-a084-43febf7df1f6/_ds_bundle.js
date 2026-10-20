/* @ds-bundle: {"format":3,"namespace":"VibeCRMDesignSystem_46d208","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"ListRow","sourcePath":"components/core/ListRow.jsx"},{"name":"Metric","sourcePath":"components/core/Metric.jsx"},{"name":"Avatar","sourcePath":"components/feedback/Avatar.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"}],"sourceHashes":{"components/core/Button.jsx":"0df80bf9e342","components/core/Card.jsx":"cc9981c87162","components/core/IconButton.jsx":"5a6fb8fa8e53","components/core/ListRow.jsx":"a0a2e4d89faa","components/core/Metric.jsx":"a0f7d1185d15","components/feedback/Avatar.jsx":"32b2c1eeaf5e","components/feedback/Badge.jsx":"b02c60270de4","components/feedback/EmptyState.jsx":"a84b34563d65","components/feedback/Skeleton.jsx":"642c2022e651","components/forms/Input.jsx":"cfd7b2311600","components/navigation/TabBar.jsx":"552ccb190bde","ui_kits/vibe-crm/ContactsScreen.jsx":"11662e37be08","ui_kits/vibe-crm/DealScreen.jsx":"0ab2834f907a","ui_kits/vibe-crm/HomeScreen.jsx":"87f274cbf87d","ui_kits/vibe-crm/data.jsx":"b52ed1584539","ui_kits/vibe-crm/icons.jsx":"a9ecb2453818"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VibeCRMDesignSystem_46d208 = window.VibeCRMDesignSystem_46d208 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — primary action element for Vibe CRM.
 * Variants: primary (green, one per view), secondary, ghost, destructive.
 * Heights: 48px default (mobile), 44px compact. Radius 6px. Weight 600 (500 for secondary/ghost).
 */
function Button({
  children,
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  iconLeft = null,
  iconRight = null,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const height = size === "compact" ? "var(--control-h-compact)" : "var(--control-h)";
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-2)",
    height,
    padding: "0 var(--space-5)",
    borderRadius: "var(--radius-md)",
    fontFamily: "var(--font-sans)",
    fontSize: "15px",
    lineHeight: 1,
    letterSpacing: "var(--tracking-tight)",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    border: "1px solid transparent",
    transition: "background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
    userSelect: "none",
    whiteSpace: "nowrap",
    ...style
  };
  const variants = {
    primary: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
      fontWeight: "var(--weight-semibold)"
    },
    secondary: {
      background: "var(--color-surface)",
      color: "var(--color-text)",
      borderColor: "var(--color-border-strong)",
      fontWeight: "var(--weight-medium)"
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-muted)",
      fontWeight: "var(--weight-medium)"
    },
    destructive: {
      background: "var(--color-error)",
      color: "#fff",
      fontWeight: "var(--weight-semibold)"
    }
  };
  const disabledStyle = disabled ? {
    background: "var(--color-surface-2)",
    color: "var(--color-text-subtle)",
    borderColor: "var(--color-border)",
    boxShadow: "none"
  } : {};
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  let interactive = {};
  if (!disabled && !loading) {
    if (variant === "primary") {
      if (active) interactive = {
        background: "var(--color-primary-active)",
        transform: "translateY(1px)"
      };else if (hover) interactive = {
        background: "var(--color-primary-hover)"
      };
    } else if (variant === "secondary" || variant === "ghost") {
      if (hover) interactive = {
        background: "var(--color-surface-2)"
      };
    } else if (variant === "destructive") {
      if (hover) interactive = {
        filter: "brightness(.9)"
      };
    }
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled || loading,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      ...base,
      ...variants[variant],
      ...interactive,
      ...disabledStyle
    }
  }, rest), loading && /*#__PURE__*/React.createElement(Spinner, null), !loading && iconLeft, children, !loading && iconRight);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 16,
      height: 16,
      borderRadius: "var(--radius-full)",
      border: "2px solid rgba(255,255,255,.4)",
      borderTopColor: "#fff",
      display: "inline-block",
      animation: "vibe-spin .7s linear infinite"
    }
  });
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — white surface with 1px border, 10px radius, xs shadow, 20px padding.
 * Optional header: title (15px/600) + optional action (rendered in primary color).
 */
function Card({
  title,
  action,
  onAction,
  children,
  padding = "var(--space-5)",
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-xs)",
      padding,
      ...style
    }
  }, rest), (title || action) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-3)",
      marginBottom: "var(--space-4)"
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: "15px",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-text)",
      letterSpacing: "var(--tracking-tight)"
    }
  }, title), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      color: "var(--color-primary)",
      fontFamily: "var(--font-sans)",
      fontSize: "14px",
      fontWeight: "var(--weight-medium)"
    }
  }, action)), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * IconButton — square icon-only button. Same variants as Button.
 * 48×48 default, 44×44 compact. Pass a Lucide icon (or any node) as children.
 */
function IconButton({
  children,
  variant = "ghost",
  size = "default",
  disabled = false,
  "aria-label": ariaLabel,
  onClick,
  style = {},
  ...rest
}) {
  const dim = size === "compact" ? "var(--control-h-compact)" : "var(--control-h)";
  const [hover, setHover] = React.useState(false);
  const variants = {
    primary: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)"
    },
    secondary: {
      background: "var(--color-surface)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border-strong)"
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-muted)"
    },
    destructive: {
      background: "var(--color-error)",
      color: "#fff"
    }
  };
  let hoverStyle = {};
  if (!disabled && hover) {
    if (variant === "primary") hoverStyle = {
      background: "var(--color-primary-hover)"
    };else if (variant === "destructive") hoverStyle = {
      filter: "brightness(.9)"
    };else hoverStyle = {
      background: "var(--color-surface-2)"
    };
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": ariaLabel,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: dim,
      height: dim,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-md)",
      border: "1px solid transparent",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background var(--duration-fast) var(--ease-standard)",
      ...variants[variant],
      ...hoverStyle,
      ...(disabled ? {
        background: "var(--color-surface-2)",
        color: "var(--color-text-subtle)"
      } : {}),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Metric.jsx
try { (() => {
/**
 * Metric — KPI tile: label (13px muted) + mono tabular figure (30px/500) + delta pill.
 * delta sign drives colour: positive=success, negative=error.
 */
function Metric({
  label,
  value,
  delta,
  deltaDirection,
  style = {}
}) {
  let dir = deltaDirection;
  if (!dir && typeof delta === "string") {
    if (delta.trim().startsWith("-") || /↓/.test(delta)) dir = "down";else dir = "up";
  }
  const isUp = dir !== "down";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13px",
      color: "var(--color-text-muted)",
      letterSpacing: "var(--tracking-tight)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: "30px",
      fontWeight: 500,
      color: "var(--color-text)",
      lineHeight: 1.1
    }
  }, value), delta != null && delta !== "" && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 8px",
      borderRadius: "var(--radius-full)",
      fontSize: "12px",
      fontWeight: "var(--weight-medium)",
      background: isUp ? "var(--color-success-bg)" : "var(--color-error-bg)",
      color: isUp ? "var(--color-success-text)" : "var(--color-error-text)",
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums"
    }
  }, isUp ? "▲" : "▼", " ", String(delta).replace(/^[+-]/, ""))));
}
Object.assign(__ds_scope, { Metric });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Metric.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Avatar.jsx
try { (() => {
/**
 * Avatar — circular initials avatar. Default uses primary-subtle bg + primary text.
 * variant="neutral" uses surface-2 + muted text. Size in px (default 40).
 */
function Avatar({
  name = "",
  initials,
  size = 40,
  variant = "primary",
  style = {}
}) {
  const text = initials || name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const palette = variant === "neutral" ? {
    background: "var(--color-surface-2)",
    color: "var(--color-text-muted)"
  } : {
    background: "var(--color-primary-subtle)",
    color: "var(--color-primary)"
  };
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": name || undefined,
    style: {
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "var(--radius-full)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-semibold)",
      fontSize: Math.round(size * 0.35),
      letterSpacing: "var(--tracking-tight)",
      ...palette,
      ...style
    }
  }, text);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/ListRow.jsx
try { (() => {
/**
 * ListRow — a contact/deal row: avatar + (name 15px/500 · subtitle 13px muted) +
 * amount (mono, right-aligned). Selected row uses surface-2 background.
 */
function ListRow({
  name,
  subtitle,
  amount,
  badge,
  selected = false,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const bg = selected || hover ? "var(--color-surface-2)" : "transparent";
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      padding: "14px 18px",
      background: bg,
      cursor: onClick ? "pointer" : "default",
      transition: "background var(--duration-fast) var(--ease-standard)",
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    size: 40
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "15px",
      fontWeight: "var(--weight-medium)",
      color: "var(--color-text)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, name), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13px",
      color: "var(--color-text-muted)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, subtitle)), badge, amount != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: "15px",
      color: "var(--color-text)",
      textAlign: "right",
      whiteSpace: "nowrap"
    }
  }, amount));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
const STATUS = {
  success: {
    fg: "var(--color-success)",
    bg: "var(--color-success-bg)",
    text: "var(--color-success-text)"
  },
  warning: {
    fg: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning-text)"
  },
  error: {
    fg: "var(--color-error)",
    bg: "var(--color-error-bg)",
    text: "var(--color-error-text)"
  },
  info: {
    fg: "var(--color-info)",
    bg: "var(--color-info-bg)",
    text: "var(--color-info-text)"
  },
  primary: {
    fg: "var(--color-primary)",
    bg: "var(--color-primary-subtle)",
    text: "var(--color-primary)"
  },
  neutral: {
    fg: "var(--color-text-muted)",
    bg: "var(--color-surface-2)",
    text: "var(--color-text-muted)"
  }
};

/**
 * Badge — status pill. Optional leading dot (7px, fg color).
 * status: success | warning | error | info | primary | neutral.
 * Common CRM mapping: Ganado=success · Pendiente=warning · Perdido=error ·
 * Nuevo lead=info · En negociación=primary · Borrador=neutral.
 */
function Badge({
  children,
  status = "neutral",
  dot = true,
  style = {}
}) {
  const s = STATUS[status] || STATUS.neutral;
  const isNeutral = status === "neutral";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      padding: "5px 12px",
      borderRadius: "var(--radius-full)",
      background: s.bg,
      color: s.text,
      border: isNeutral ? "1px solid var(--color-border)" : "1px solid transparent",
      fontFamily: "var(--font-sans)",
      fontSize: "13px",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1.2,
      letterSpacing: "var(--tracking-tight)",
      whiteSpace: "nowrap",
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 7,
      height: 7,
      borderRadius: "var(--radius-full)",
      background: s.fg,
      flexShrink: 0
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/**
 * EmptyState — icon in a surface-2 square + title (15px/600) + one help line + CTA.
 * Pass `icon` (Lucide node) and `action` (a Button).
 */
function EmptyState({
  icon,
  title,
  help,
  action,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "var(--space-3)",
      padding: "var(--space-10) var(--space-6)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 48,
      height: 48,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-xl)",
      background: "var(--color-surface-2)",
      color: "var(--color-text-muted)"
    }
  }, icon), title && /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: "15px",
      fontWeight: "var(--weight-semibold)",
      color: "var(--color-text)"
    }
  }, title), help && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "13px",
      color: "var(--color-text-muted)",
      maxWidth: 280
    }
  }, help), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-2)"
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
/**
 * Skeleton — loading placeholder block (surface-2 with pulse). Use width/height/radius.
 */
function Skeleton({
  width = "100%",
  height = 16,
  radius = "var(--radius-md)",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "block",
      width,
      height,
      borderRadius: radius,
      background: "var(--color-surface-2)",
      animation: "vibe-pulse 1.4s ease-in-out infinite",
      ...style
    }
  });
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — text field. 48px height, label above, focus ring, error + helper text.
 * Pass `icon` for a leading icon (padding adjusts). `error` switches to error styling.
 */
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon = null,
  error = null,
  helper = null,
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error ? "var(--color-error)" : focus ? "var(--color-primary)" : "var(--color-border-strong)";
  let ring = "none";
  if (focus && !error) ring = "0 0 0 3px var(--color-primary-subtle)";
  if (error) ring = "0 0 0 3px var(--color-error-bg)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontSize: "14px",
      fontWeight: "var(--weight-medium)",
      color: "var(--color-text)",
      letterSpacing: "var(--tracking-tight)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center"
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 14,
      display: "inline-flex",
      color: "var(--color-text-subtle)",
      pointerEvents: "none"
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onFocusCapture: () => setFocus(true),
    onBlurCapture: () => setFocus(false),
    style: {
      width: "100%",
      height: "var(--control-h)",
      padding: icon ? "0 14px 0 40px" : "0 14px",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--radius-md)",
      background: disabled ? "var(--color-surface-2)" : "var(--color-surface)",
      color: "var(--color-text)",
      fontFamily: "var(--font-sans)",
      fontSize: "15px",
      letterSpacing: "var(--tracking-tight)",
      outline: "none",
      boxShadow: ring,
      transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
      cursor: disabled ? "not-allowed" : "text"
    }
  }, rest))), error && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: "13px",
      color: "var(--color-error-text)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  })), error), !error && helper && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13px",
      color: "var(--color-text-muted)"
    }
  }, helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
/**
 * TabBar — fixed bottom mobile navigation, 5 items.
 * items: [{ id, label, icon }]. Active item uses primary; inactive uses text-subtle.
 * Each item is ≥56px tall. Container has a 1px top border on surface.
 */
function TabBar({
  items = [],
  active,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      background: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      width: "100%",
      ...style
    }
  }, items.map(item => {
    const isActive = item.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      onClick: () => onChange && onChange(item.id),
      "aria-current": isActive ? "page" : undefined,
      style: {
        flex: 1,
        minHeight: 56,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "8px 4px",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: isActive ? "var(--color-primary)" : "var(--color-text-subtle)",
        fontWeight: isActive ? "var(--weight-semibold)" : "var(--weight-medium)",
        fontFamily: "var(--font-sans)",
        transition: "color var(--duration-fast) var(--ease-standard)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        width: 22,
        height: 22
      },
      "aria-hidden": "true"
    }, item.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "11px",
        letterSpacing: "var(--tracking-tight)"
      }
    }, item.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vibe-crm/ContactsScreen.jsx
try { (() => {
// Contactos — searchable contact/deal list. Shares scope via window.
const {
  Card,
  Badge,
  Input,
  ListRow,
  IconButton
} = window.VibeCRMDesignSystem_46d208;
function ContactsScreen({
  onOpenContact
}) {
  const [q, setQ] = React.useState("");
  const list = window.CONTACTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.company.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 16
    }
  }, /*#__PURE__*/React.createElement(window.ScreenHeader, {
    title: "Contactos",
    right: /*#__PURE__*/React.createElement(IconButton, {
      variant: "ghost",
      "aria-label": "Filtrar"
    }, /*#__PURE__*/React.createElement(window.Filter, {
      size: 20
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 20px 4px"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: /*#__PURE__*/React.createElement(window.Search, {
      size: 16
    }),
    placeholder: "Buscar contacto o empresa",
    value: q,
    onChange: e => setQ(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 20px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "var(--color-text-subtle)"
    }
  }, list.length, " contactos")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", null, list.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      borderTop: i ? "1px solid var(--color-border)" : "none"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    name: c.name,
    subtitle: c.company,
    amount: c.amount,
    badge: /*#__PURE__*/React.createElement(Badge, {
      status: c.status
    }, c.statusLabel),
    onClick: () => onOpenContact && onOpenContact(c.name)
  }))), list.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "32px 20px",
      textAlign: "center",
      fontSize: 14,
      color: "var(--color-text-muted)"
    }
  }, "Sin resultados para \u201C", q, "\u201D.")))));
}
Object.assign(window, {
  ContactsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vibe-crm/ContactsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vibe-crm/DealScreen.jsx
try { (() => {
// Detalle de contacto — header, deal stage, actions, info rows. Shares scope via window.
const {
  Card,
  Badge,
  Avatar,
  Button,
  Metric
} = window.VibeCRMDesignSystem_46d208;
function InfoRow({
  icon,
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      borderTop: "1px solid var(--color-border)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-subtle)",
      display: "inline-flex"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-subtle)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--color-text)"
    }
  }, value)));
}
function DealScreen({
  contact,
  onBack
}) {
  const c = contact || window.CONTACTS[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 16
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 12px 8px"
    }
  }, /*#__PURE__*/React.createElement(window.VibeCRMDesignSystem_46d208.IconButton, {
    variant: "ghost",
    "aria-label": "Atr\xE1s",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(window.ChevronLeft, {
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--color-text-muted)"
    }
  }, "Contactos")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: "8px 20px 4px"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: c.name,
    size: 64
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.011em"
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--color-text-muted)",
      marginTop: 2
    }
  }, c.company)), /*#__PURE__*/React.createElement(Badge, {
    status: c.status
  }, c.statusLabel)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      padding: "16px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      flex: 1
    },
    iconLeft: /*#__PURE__*/React.createElement(window.Phone, {
      size: 18
    })
  }, "Llamar"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    style: {
      flex: 1
    },
    iconLeft: /*#__PURE__*/React.createElement(window.Mail, {
      size: 18
    })
  }, "Email")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "Valor de la venta",
    value: c.amount
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      paddingTop: 8,
      borderTop: "1px solid var(--color-border)"
    }
  }, /*#__PURE__*/React.createElement(window.Check, {
    size: 16,
    style: {
      color: "var(--color-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--color-text)"
    }
  }, c.stage)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Detalles"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: -4
    }
  }, /*#__PURE__*/React.createElement(InfoRow, {
    icon: /*#__PURE__*/React.createElement(window.Mail, {
      size: 18
    }),
    label: "Email",
    value: c.email
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: /*#__PURE__*/React.createElement(window.Phone, {
      size: 18
    }),
    label: "Tel\xE9fono",
    value: c.phone
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: /*#__PURE__*/React.createElement(window.Building, {
      size: 18
    }),
    label: "Empresa",
    value: c.company
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: /*#__PURE__*/React.createElement(window.Calendar, {
      size: 18
    }),
    label: "Pr\xF3ximo seguimiento",
    value: "Vie 26 jun \xB7 10:00"
  })))));
}
Object.assign(window, {
  DealScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vibe-crm/DealScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vibe-crm/HomeScreen.jsx
try { (() => {
// Inicio — dashboard: greeting, KPIs, pipeline progress, recent activity. Shares scope via window.
const {
  Card,
  Metric,
  Badge,
  Avatar,
  IconButton
} = window.VibeCRMDesignSystem_46d208;
function ScreenHeader({
  title,
  subtitle,
  right
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: "20px 20px 8px"
    }
  }, /*#__PURE__*/React.createElement("div", null, subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--color-text-muted)",
      marginBottom: 2
    }
  }, subtitle), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-0.011em",
      color: "var(--color-text)"
    }
  }, title)), right);
}
function PipelineBar() {
  const segs = [{
    w: 38,
    c: "var(--color-primary)"
  }, {
    w: 24,
    c: "var(--color-warning)"
  }, {
    w: 20,
    c: "var(--color-info)"
  }, {
    w: 18,
    c: "var(--color-surface-2)"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      height: 10,
      borderRadius: 9999,
      overflow: "hidden"
    }
  }, segs.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: s.w + "%",
      background: s.c
    }
  })));
}
function HomeScreen({
  onOpenContact
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 16
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, {
    subtitle: "Buenos d\xEDas",
    title: "Marta",
    right: /*#__PURE__*/React.createElement(IconButton, {
      variant: "ghost",
      "aria-label": "Notificaciones"
    }, /*#__PURE__*/React.createElement(window.Bell, {
      size: 22
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      padding: "12px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "16px"
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "Ventas del mes",
    value: "\u20AC48.250",
    delta: "12%",
    deltaDirection: "up"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "16px"
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "Tasa de cierre",
    value: "32%",
    delta: "4%",
    deltaDirection: "down"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Pipeline",
    action: "Ver ventas",
    onAction: () => {}
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: 30,
      fontWeight: 500
    }
  }, "\u20AC83.150"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--color-text-muted)"
    }
  }, "en 6 negociaciones")), /*#__PURE__*/React.createElement(PipelineBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    status: "primary"
  }, "3 En negociaci\xF3n"), /*#__PURE__*/React.createElement(Badge, {
    status: "warning"
  }, "1 Pendiente"), /*#__PURE__*/React.createElement(Badge, {
    status: "info"
  }, "1 Lead"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 0"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Actividad reciente",
    action: "Ver todo",
    onAction: () => {},
    padding: "20px 0 8px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, window.ACTIVITY.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: () => onOpenContact && onOpenContact(a.name),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px",
      background: "none",
      border: "none",
      textAlign: "left",
      cursor: "pointer",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: a.name,
    size: 36
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--color-text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, a.name), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-text-muted)"
    }
  }, a.text)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--color-text-subtle)"
    }
  }, a.when)), a.amount && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontVariantNumeric: "tabular-nums",
      fontSize: 14,
      color: "var(--color-success-text)"
    }
  }, a.amount)))))));
}
Object.assign(window, {
  HomeScreen,
  ScreenHeader
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vibe-crm/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vibe-crm/data.jsx
try { (() => {
// Mock data for the Vibe CRM kit. Shared via window.
const CONTACTS = [{
  id: 1,
  name: "Marta López",
  company: "Acme S.L.",
  amount: "€12.400",
  status: "primary",
  statusLabel: "En negociación",
  email: "marta@acme.es",
  phone: "+34 600 112 233",
  stage: "Propuesta enviada"
}, {
  id: 2,
  name: "Carlos Ruiz",
  company: "Beta Digital",
  amount: "€8.900",
  status: "warning",
  statusLabel: "Pendiente",
  email: "carlos@betadigital.com",
  phone: "+34 611 445 667",
  stage: "Esperando firma"
}, {
  id: 3,
  name: "Nuria Vega",
  company: "Gamma Studio",
  amount: "€3.200",
  status: "info",
  statusLabel: "Nuevo lead",
  email: "nuria@gammastudio.io",
  phone: "+34 622 778 990",
  stage: "Primer contacto"
}, {
  id: 4,
  name: "Diego Sanz",
  company: "Delta Comercio",
  amount: "€21.000",
  status: "success",
  statusLabel: "Ganado",
  email: "diego@deltacomercio.es",
  phone: "+34 633 221 100",
  stage: "Cerrado"
}, {
  id: 5,
  name: "Lucía Marín",
  company: "Epsilon Web",
  amount: "€5.750",
  status: "primary",
  statusLabel: "En negociación",
  email: "lucia@epsilonweb.com",
  phone: "+34 644 556 677",
  stage: "Demo agendada"
}, {
  id: 6,
  name: "Pablo Ortega",
  company: "Zeta Retail",
  amount: "€1.900",
  status: "error",
  statusLabel: "Perdido",
  email: "pablo@zetaretail.es",
  phone: "+34 655 889 001",
  stage: "Sin respuesta"
}];
const ACTIVITY = [{
  id: 1,
  name: "Diego Sanz",
  text: "marcó la venta como Ganada",
  amount: "€21.000",
  when: "hace 2 h",
  status: "success"
}, {
  id: 2,
  name: "Marta López",
  text: "abrió tu propuesta",
  amount: null,
  when: "hace 4 h",
  status: "primary"
}, {
  id: 3,
  name: "Nuria Vega",
  text: "es un nuevo lead",
  amount: null,
  when: "ayer",
  status: "info"
}];
Object.assign(window, {
  CONTACTS,
  ACTIVITY
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vibe-crm/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vibe-crm/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide icons (https://lucide.dev) — official path data, 1.5px stroke, currentColor.
// Loaded as a babel script in index.html; shares scope via window.
const VibeIcon = ({
  size = 22,
  children,
  ...rest
}) => /*#__PURE__*/React.createElement("svg", _extends({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true"
}, rest), children);
const Home = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 9.5 12 3l9 6.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 10v10h5v-6h4v6h5V10"
}));
const Users = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "9",
  cy: "7",
  r: "4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M22 21v-2a4 4 0 0 0-3-3.87"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 3.13a4 4 0 0 1 0 7.75"
}));
const TrendingUp = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 17l6-6 4 4 7-7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14 7h5v5"
}));
const BarChart = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("line", {
  x1: "6",
  y1: "20",
  x2: "6",
  y2: "12"
}), /*#__PURE__*/React.createElement("line", {
  x1: "12",
  y1: "20",
  x2: "12",
  y2: "4"
}), /*#__PURE__*/React.createElement("line", {
  x1: "18",
  y1: "20",
  x2: "18",
  y2: "14"
}));
const MoreH = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "5",
  cy: "12",
  r: "1"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "1"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "19",
  cy: "12",
  r: "1"
}));
const MoreV = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "5",
  r: "1"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "1"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "19",
  r: "1"
}));
const Plus = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("line", {
  x1: "12",
  y1: "5",
  x2: "12",
  y2: "19"
}), /*#__PURE__*/React.createElement("line", {
  x1: "5",
  y1: "12",
  x2: "19",
  y2: "12"
}));
const Search = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "8"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const Bell = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
}));
const ChevronLeft = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "m15 18-6-6 6-6"
}));
const ChevronRight = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "m9 18 6-6-6-6"
}));
const Phone = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
}));
const Mail = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("rect", {
  x: "2",
  y: "4",
  width: "20",
  height: "16",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "m22 7-10 5L2 7"
}));
const Building = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "2",
  width: "16",
  height: "20",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 22v-4h6v4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"
}));
const Calendar = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "18",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 2v4M8 2v4M3 10h18"
}));
const Filter = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M22 3H2l8 9.46V19l4 2v-8.54z"
}));
const Check = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
const ArrowUpRight = p => /*#__PURE__*/React.createElement(VibeIcon, p, /*#__PURE__*/React.createElement("path", {
  d: "M7 17 17 7M7 7h10v10"
}));
Object.assign(window, {
  Home,
  Users,
  TrendingUp,
  BarChart,
  MoreH,
  MoreV,
  Plus,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building,
  Calendar,
  Filter,
  Check,
  ArrowUpRight
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vibe-crm/icons.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.Metric = __ds_scope.Metric;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.TabBar = __ds_scope.TabBar;

})();
