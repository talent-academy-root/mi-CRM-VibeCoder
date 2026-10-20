import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Esquema del MVP — ver PRD "Datos" y TAL-6.
 *
 * Identidad: se usa la tabla `users` de Convex Auth (authTables), extendida con
 * el campo `rol` del negocio. El resto de authTables (authSessions, authAccounts,
 * …) se incluye tal cual con el spread. `autorId` / `responsableId` /
 * `completadoPorId` referencian `users`.
 *
 * Nota sobre Cliente.estado (Nuevo lead / En negociación / Ganado / Perdido):
 * es un valor CALCULADO a partir de las ventas del cliente, no se guarda ni se
 * edita a mano. Se deriva en el helper `estadoDe` (convex/clientes.ts):
 *   - sin ventas                    -> "nuevo_lead"
 *   - alguna venta "abierta"        -> "en_negociacion"
 *   - sin abiertas, alguna "ganada" -> "ganado"
 *   - todas "perdida"               -> "perdido"
 * Se resuelve con UNA fila del índice `by_cliente_estado` de `ventas`, no
 * leyendo todas sus ventas — ver el aviso en `estadoDe` antes de tocar los
 * literales de `ventas.estado`.
 *
 * Las fechas (fecha, vence, fechaHecho) se guardan como string ISO "YYYY-MM-DD"
 * (sin hora), en zona local del usuario — el orden lexicográfico coincide con el
 * cronológico.
 */
export default defineSchema({
  ...authTables,

  // Tabla `users` de Convex Auth extendida con `rol`. Debe conservar los campos
  // e índice de authTables (perder el índice `email` o un campo rompe el login).
  // `rol` es opcional en el schema pero lo exige `requireUsuario`: solo el
  // servidor (vía createAccount con profile.rol — el seed o `usuarios.invitar`)
  // puede provisionarlo.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    rol: v.optional(v.union(v.literal("propietaria"), v.literal("comercial"))),

    // Acceso retirado por la dueña (TAL-60). Opcional a propósito: `undefined`
    // significa ACTIVA, así las filas anteriores a este campo siguen valiendo
    // sin migración. Solo `false` bloquea, y lo hace por dos vías —
    // `beforeSessionCreation` impide crear sesiones nuevas y `requireUsuario`
    // corta las que ya estaban abiertas.
    activo: v.optional(v.boolean()),

    // Invitada y todavía sin entrar (TAL-60). Es lo que hace que el paso 1 del
    // login le ofrezca configurar su contraseña en vez de pedírsela.
    //
    // Significa exactamente «se le invitó y aún no ha accedido por ninguna
    // vía», NO «no tiene contraseña»: quien entre con Google seguirá sin
    // tenerla. Se enciende solo en `usuarios.invitar` y se apaga en un único
    // sitio, `beforeSessionCreation` (convex/auth.ts), que es la misma
    // transacción que inserta la sesión — así apagarla y entrar son atómicos.
    contrasenaPendiente: v.optional(v.boolean()),

    // Cuándo se mandó esa invitación (TAL-69, S7). Existe solo para que la marca
    // de arriba pueda CADUCAR: sin esto, una dirección invitada que nunca llega
    // a entrar —un correo mal tecleado, alguien que no se incorpora— queda
    // señalada para siempre en el paso 1 del acceso, que es una fuga permanente
    // por algo que ya no va a pasar. A los 14 días deja de contar.
    //
    // Se escribe con `contrasenaPendiente` y se borra con ella.
    invitadaEn: v.optional(v.number()),
  }).index("email", ["email"]),

  // Cuota de solicitudes de recuperación de contraseña (TAL-65). Los CÓDIGOS no
  // viven aquí: los guarda `authVerificationCodes` de authTables, hasheados.
  // Esta tabla solo cuenta cuántas veces se ha pedido un código por correo, para
  // que nadie pueda usar la pantalla de login como ametralladora de correos
  // contra un buzón ajeno (la librería no limita la PETICIÓN, solo la
  // verificación). Se escribe únicamente desde internalMutation.
  intentosRecuperacion: defineTable({
    email: v.string(),
    momento: v.number(),
    // Compuesto: permite leer solo la ventana de la última hora de un correo en
    // vez de todo su histórico.
  })
    .index("by_email_momento", ["email", "momento"])
    // Por antigüedad y SIN el correo, que es lo que el compuesto de arriba no
    // permite: su primera columna es el email, así que barrer "todo lo viejo"
    // exigiría recorrer la tabla entera. Lo usa el cron de limpieza (TAL-69, S2).
    .index("by_momento", ["momento"]),

  clientes: defineTable({
    nombre: v.string(),
    empresa: v.optional(v.string()),
    telefono: v.optional(v.string()),
    email: v.optional(v.string()),
    canalOrigen: v.optional(
      v.union(
        v.literal("web"),
        v.literal("redes"),
        v.literal("email"),
        v.literal("whatsapp"),
      ),
    ),
    nota: v.optional(v.string()),
    // "fecha de alta" = _creationTime (campo automático de Convex).
    //
    // Sin índices: la lista se lee entera (`listarConEstado`) y el filtrado por
    // nombre/email/teléfono ocurre en el navegador (ClientesClient). Había aquí
    // un `by_email` y un `searchIndex("search_nombre")` que no consultaba nadie
    // — solo se pagaban en cada alta y edición. Si algún día se avisa de
    // clientes duplicados por correo, `by_email` vuelve; hoy no hay tal regla y
    // el índice no la insinúa.
  }),

  interacciones: defineTable({
    clienteId: v.id("clientes"),
    fecha: v.string(),
    canal: v.union(
      v.literal("llamada"),
      v.literal("email"),
      v.literal("whatsapp"),
      v.literal("en_persona"),
    ),
    texto: v.string(),
    autorId: v.id("users"),
    // Compuesto: `order("desc")` sobre él da el historial ya ordenado por fecha
    // y, en empates del mismo día (fecha no lleva hora), por _creationTime.
  }).index("by_cliente_fecha", ["clienteId", "fecha"]),

  seguimientos: defineTable({
    clienteId: v.id("clientes"),
    accion: v.string(),
    vence: v.string(),
    responsableId: v.id("users"),
    hecho: v.boolean(),
    fechaHecho: v.optional(v.string()),
    // Quién marcó el seguimiento como hecho — solo esa persona puede deshacerlo.
    completadoPorId: v.optional(v.id("users")),
  })
    .index("by_hecho_vence", ["hecho", "vence"])
    // Los pendientes de un cliente se ordenan por cuándo VENCEN, y los completados
    // por cuándo se HICIERON: son campos distintos, así que hacen falta dos índices.
    // Con uno solo por `vence`, truncar los completados descartaría un seguimiento
    // que venció hace meses pero se cerró hoy — justo el que encabeza el historial.
    // Indexar `fechaHecho` (opcional en el schema) es seguro: `marcarHecho` escribe
    // `hecho: true` y `fechaHecho` juntos, y `deshacer` los limpia juntos.
    .index("by_cliente_hecho_vence", ["clienteId", "hecho", "vence"])
    .index("by_cliente_hecho_fechaHecho", ["clienteId", "hecho", "fechaHecho"]),

  ventas: defineTable({
    clienteId: v.id("clientes"),
    concepto: v.string(),
    // Importe en la moneda del negocio (dólares), con hasta dos decimales. El
    // backend lo normaliza al guardarlo; las sumas se hacen en centavos.
    importe: v.number(),
    estado: v.union(
      v.literal("abierta"),
      v.literal("ganada"),
      v.literal("perdida"),
    ),
    fecha: v.string(),
    autorId: v.id("users"),
    // Compuesto por la misma razón que en `interacciones`: el historial de la
    // ficha ordena por `fecha` y se trunca con `take`, así que el índice tiene
    // que ordenar por ese campo o se descartarían filas equivocadas.
  })
    .index("by_cliente_fecha", ["clienteId", "fecha"])
    // Para `estadoDe`, que antes leía TODAS las ventas del cliente por el
    // prefijo `clienteId` de arriba. Ordenado por `estado`, la primera fila ya
    // es la que decide el estado del cliente, así que basta una lectura: el
    // coste deja de depender de cuántas ventas tenga. Ver el aviso sobre el
    // orden de los literales en `estadoDe` (convex/clientes.ts).
    //
    // Sigue sin haber `by_estado` a secas: /ventas necesita los cuatro
    // contadores a la vez, así que lee la tabla entera una vez y filtra en
    // memoria.
    .index("by_cliente_estado", ["clienteId", "estado"]),
});
