import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Solicitud del código para recuperar la contraseña (TAL-65).
 *
 * Existe como envoltorio en vez de dejar que el cliente llame directamente a
 * `auth:signIn` con `flow: "reset"` por dos motivos que no se pueden resolver
 * desde el frontend:
 *
 * 1. ENUMERACIÓN. La librería lanza `InvalidAccountId` cuando el correo no
 *    tiene cuenta de contraseña, y devuelve `{started:true}` cuando sí la
 *    tiene. Esa diferencia se ve desde la consola del navegador por mucho que
 *    la pantalla enseñe siempre el mismo aviso. Aquí la respuesta es SIEMPRE
 *    `null`, pase lo que pase.
 * 2. CUOTA. La librería solo limita la VERIFICACIÓN de códigos, no su
 *    petición. Sin freno, cualquiera puede lanzar cientos de correos contra un
 *    buzón ajeno desde vibe-crm.net y quemar la reputación del dominio.
 *
 * Lo que esta cuota NO resuelve (riesgo aceptado, TAL-67): al ser por correo y
 * al ser esta acción anónima por diseño, un tercero puede consumir los tres
 * intentos de la dirección de otra persona y dejarla sin poder pedir su código
 * durante esa hora; además, cada emisión nueva invalida el código anterior.
 * Subir el número no ayuda —el atacante puede consumirlos todos igual—; haría
 * falta una señal de identidad (IP o captcha) que aquí no existe. Mientras
 * tanto, la salida es entrar con la contraseña o con Google, o pedir a la dueña
 * que ejecute `soporte:desbloquearAcceso`.
 */

const SEGUNDOS_ESPERA = 60;
const MAXIMO_POR_HORA = 3;
const UNA_HORA_MS = 60 * 60 * 1000;

/**
 * Decide y registra la cuota en UNA sola transacción.
 *
 * Que sea una mutation (y no una query + un insert aparte) es lo que hace la
 * comprobación fiable: dos solicitudes simultáneas se serializan y la segunda
 * ve la reserva ya confirmada de la primera. Con lectura y escritura separadas,
 * ambas pasarían el filtro y saldrían dos correos.
 *
 * Devuelve el id de la reserva creada, o null si toca esperar.
 */
export const reservarEnvio = internalMutation({
  args: { email: v.string() },
  returns: v.union(v.id("intentosRecuperacion"), v.null()),
  handler: async (ctx, args) => {
    const ahora = Date.now();
    const desdeHaceUnaHora = ahora - UNA_HORA_MS;

    const recientes = await ctx.db
      .query("intentosRecuperacion")
      .withIndex("by_email_momento", (q) =>
        q.eq("email", args.email).gte("momento", desdeHaceUnaHora),
      )
      .collect();

    // Limpieza acotada: de paso se tiran los intentos viejos de este correo, que
    // ya no cuentan para nada. Evita que la tabla crezca sin fin sin necesidad
    // de un cron.
    const viejos = await ctx.db
      .query("intentosRecuperacion")
      .withIndex("by_email_momento", (q) =>
        q.eq("email", args.email).lt("momento", desdeHaceUnaHora),
      )
      .collect();
    for (const viejo of viejos) {
      await ctx.db.delete(viejo._id);
    }

    if (recientes.length >= MAXIMO_POR_HORA) {
      return null;
    }
    const ultimo = recientes.reduce<number>(
      (max, intento) => Math.max(max, intento.momento),
      0,
    );
    if (ahora - ultimo < SEGUNDOS_ESPERA * 1000) {
      return null;
    }

    return await ctx.db.insert("intentosRecuperacion", {
      email: args.email,
      momento: ahora,
    });
  },
});

/**
 * Barrido periódico de las solicitudes que ya no cuentan para nada (TAL-69, S2).
 *
 * `reservarEnvio` limpia de paso lo viejo, pero solo del correo que está pidiendo
 * un código: una dirección que pide uno y no vuelve nunca deja sus filas ahí para
 * siempre. Esto es el cinturón que cierra la clase entera de problema en vez de
 * un camino concreto, y por eso existe el índice `by_momento` — el compuesto
 * empieza por el correo y no sirve para barrer por antigüedad.
 *
 * Acotado a `LOTE` por ejecución para no acercarse a los límites de escritura de
 * una mutation. Se ejecuta cada hora (`convex/crons.ts`), así que si algún día
 * hubiera un pico se drena en unas cuantas pasadas en vez de fallar entera.
 *
 * Devuelve cuántas ha borrado: es la evidencia de que el cron está vivo.
 */
export const limpiarIntentosViejos = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const LOTE = 500;
    const limite = Date.now() - UNA_HORA_MS;
    const viejos = await ctx.db
      .query("intentosRecuperacion")
      .withIndex("by_momento", (q) => q.lt("momento", limite))
      .take(LOTE);
    for (const viejo of viejos) {
      await ctx.db.delete(viejo._id);
    }
    return viejos.length;
  },
});

/**
 * Suelta una reserva concreta cuando el envío falló.
 *
 * Recibe el id exacto y no "la última de este correo": si Resend tarda más que
 * el cooldown, una segunda solicitud podría haber reservado ya, y borrar la más
 * reciente liberaría la reserva equivocada.
 *
 * Hace falta porque la librería crea el código ANTES de intentar el envío: sin
 * esto, un fallo de Resend consumiría cuota de alguien que nunca recibió nada.
 */
export const liberarEnvio = internalMutation({
  args: { reservaId: v.id("intentosRecuperacion") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reservaId);
    return null;
  },
});

/**
 * Pide un código de recuperación.
 *
 * INVARIANTE: devuelve `null` y NO lanza jamás, exista la cuenta, no exista, o
 * esté Resend caído. Cualquier grieta en esto reabre la enumeración de cuentas:
 * como la librería falla antes de llegar al envío cuando no hay cuenta, un
 * error de entrega solo puede originarse en un correo que SÍ existe, y
 * propagarlo delataría cuáles están dados de alta justo durante una caída.
 */
export const solicitarCodigo = action({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const email = args.email.trim().toLowerCase();
    if (email === "") {
      return null;
    }

    // Sin el secreto configurado, `Password.profile()` rechaza el flujo "reset"
    // y NO se emite ningún código. Se comprueba aquí, antes de reservar cuota,
    // para que quede un rastro claro en los logs: el error de ese rechazo cae
    // en el catch mudo de más abajo, así que sin esta línea la recuperación
    // fallaría en silencio para siempre y la persona seguiría viendo "te
    // llegará un código". No depende de la cuenta consultada, así que no
    // reabre la enumeración.
    if (process.env.RECUPERACION_SECRETO === undefined) {
      console.error("recuperacion: falta RECUPERACION_SECRETO");
      return null;
    }

    // La cuota se comprueba antes de llamar a signIn: generar un código nuevo
    // borra el anterior, así que dejar pasar una petición repetida invalidaría
    // el código que la persona acaba de recibir.
    const reservaId: Id<"intentosRecuperacion"> | null = await ctx.runMutation(
      internal.recuperacion.reservarEnvio,
      { email },
    );
    if (reservaId === null) {
      return null;
    }

    try {
      await ctx.runAction(api.auth.signIn, {
        provider: "password",
        params: {
          email,
          flow: "reset",
          // Prueba de que la solicitud viene de aquí y no de una llamada suelta
          // a la action pública `auth:signIn`. La comprueba `Password.profile()`
          // en convex/auth.ts; el navegador no conoce este valor.
          secretoInterno: process.env.RECUPERACION_SECRETO,
        },
      });
    } catch {
      // Se libera la reserva en CUALQUIER fallo, no solo en los de envío.
      //
      // Antes se distinguía por el tipo de error, y eso dejó de tener sentido
      // por dos motivos (TAL-69). El primero es que ya no se puede: el
      // envoltorio de `auth:signIn` normaliza todos los errores internos a un
      // ConvexError idéntico, así que el tipo ya no dice de qué fallo se trata.
      // El segundo es que la distinción sobraba: si `signIn` lanzó, por el
      // motivo que sea, esta persona NO ha recibido ningún código, y cobrarle
      // cuota por algo que no llegó nunca fue siempre lo incorrecto.
      //
      // Y esto es además lo que cierra el crecimiento sin tope de la tabla (S2):
      // la reserva se inserta antes de saber si la cuenta existe, así que sin
      // esta liberación cualquiera podía sembrar tres filas permanentes por cada
      // dirección inventada, sin autenticarse y sin que nadie las borrara.
      //
      // Best-effort: si la propia liberación fallara, no puede salir de aquí
      // como excepción — esta ruta es pública y cualquier grieta reabre la
      // enumeración. Sin el correo en el log: es compartido.
      try {
        await ctx.runMutation(internal.recuperacion.liberarEnvio, {
          reservaId,
        });
      } catch {
        // Este sí puede ir aquí: solo se alcanza si falla la propia liberación,
        // que no depende de si la cuenta existe.
        console.error("recuperacion: no se pudo liberar la reserva");
      }
      // El registro del fallo va por el scheduler y NO con un console.error
      // aquí. Suena a manía y no lo es: en un deployment de desarrollo, Convex
      // devuelve al cliente las `logLines` de la invocación, y este camino solo
      // se recorre cuando la cuenta NO existe. Una línea de log que aparece
      // exactamente para los correos desconocidos es un delator tan bueno como
      // un mensaje de error distinto — comprobado al verificar TAL-69.
      //
      // Al programarlo, el mensaje se escribe en otra invocación: sigue estando
      // entero en los logs del deployment, que es donde hace falta, y no viaja
      // en esta respuesta.
      await ctx.scheduler.runAfter(0, internal.recuperacion.registrarFallo, {});
    }
    return null;
  },
});

/**
 * Escribe en el log que una solicitud de código no salió adelante.
 *
 * Existe solo para que ese registro ocurra FUERA de la invocación que responde
 * al navegador (ver el comentario de arriba). Sin texto sobre el correo: es un
 * log compartido y la dirección no debe aparecer en él.
 */
export const registrarFallo = internalAction({
  args: {},
  returns: v.null(),
  handler: async (): Promise<null> => {
    console.error("recuperacion: no se pudo emitir el código");
    return null;
  },
});
