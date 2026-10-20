import { v, ConvexError } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Envío de correo con Resend, compartido por los tres mensajes que manda el
 * producto: el código para recuperar la contraseña (`codigoRecuperacion.ts`), el
 * aviso de que esa contraseña ha cambiado y la invitación a entrar por primera
 * vez (los dos, aquí abajo).
 *
 * Se usa `fetch` y no el SDK de Resend porque `enviarCorreo` acaba ejecutándose
 * dentro de la action `signIn` declarada en convex/auth.ts, y ese fichero
 * exporta también una query y una mutation: nunca puede llevar "use node". El
 * aislado de Convex trae fetch, así que no hace falta nada más.
 *
 * Este módulo NO debe importar `./_generated/api`: lo importa
 * `codigoRecuperacion.ts`, que a su vez importa `auth.ts`, y el ciclo rompe la
 * inferencia de tipos de Convex.
 */

export const REMITENTE = "Vibe CRM <no-reply@vibe-crm.net>";

/**
 * CONTRATO: los tres modos de fallo (falta la API key, `fetch` no llega, o
 * Resend responde con error) lanzan **ConvexError**, nunca otro tipo de error.
 *
 * Ojo, esto ya NO es lo que decide si se libera la cuota: desde TAL-69,
 * `recuperacion.solicitarCodigo` la libera ante cualquier fallo, porque el
 * envoltorio de `auth:signIn` normaliza todos los errores internos y el tipo
 * dejó de distinguirlos. El contrato se mantiene igualmente por dos razones:
 * un ConvexError no arrastra traza de pila al cruzar hacia el cliente, y deja
 * explícito que un fallo de entrega es una condición esperada y no un error de
 * programación.
 */
export async function enviarCorreo({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey === undefined) {
    // Marcador interno para quien llame; su texto no llega a la persona (ver la
    // nota sobre enumeración en recuperacion.ts).
    throw new ConvexError("Falta RESEND_API_KEY");
  }

  let respuesta: Response;
  try {
    respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: REMITENTE, to: [to], subject, text, html }),
    });
  } catch {
    // Timeout, DNS o red: `fetch` lanza un TypeError, que no es ConvexError.
    // Se reetiqueta como fallo de entrega para no romper el contrato de arriba.
    console.error("Resend: no se pudo conectar");
    throw new ConvexError("Resend no aceptó el envío");
  }

  if (!respuesta.ok) {
    // Solo el código de estado: el cuerpo puede traer el correo de destino y
    // este log es compartido. Nunca se registra el token, el destinatario ni la
    // cabecera de autorización.
    console.error(`Resend respondió ${respuesta.status}`);
    throw new ConvexError("Resend no aceptó el envío");
  }
}

const ASUNTO_CAMBIO = "Tu contraseña de Vibe CRM ha cambiado";

function textoCambio(): string {
  return `Hola,

Te escribimos para avisarte de que la contraseña de tu cuenta de Vibe CRM
acaba de cambiar, y de que se ha cerrado la sesión en tus otros dispositivos.

Si has sido tú, no tienes que hacer nada.

Si NO has sido tú, alguien ha usado tu cuenta: avisa cuanto antes a la
responsable del CRM y cambia también la contraseña de tu correo.

— Vibe CRM`;
}

/**
 * Sin enlaces ni botones a propósito: un correo de seguridad que pide hacer clic
 * es indistinguible de un phishing, y aquí no hay nada que confirmar.
 */
function htmlCambio(): string {
  return `<div style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:17px;font-weight:600">Vibe CRM</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      La contraseña de tu cuenta acaba de cambiar, y se ha cerrado la sesión en
      tus otros dispositivos.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      Si has sido tú, no tienes que hacer nada.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#78716c">
      Si no has sido tú, alguien ha usado tu cuenta: avisa cuanto antes a la
      responsable del CRM y cambia también la contraseña de tu correo.
    </p>
  </div>
</div>`;
}

/**
 * Aviso de que la contraseña ha cambiado (TAL-66).
 *
 * La programa `createOrUpdateUser` (convex/auth.ts) con el scheduler al canjear
 * el código de recuperación. Es la única señal que le queda a la persona si
 * quien pidió el código fue otro: el correo del código avisa ANTES, pero para
 * entonces el buzón ya podría estar en manos ajenas.
 *
 * Entrega best-effort: un fallo de Resend se registra y se queda ahí. Va en una
 * tarea programada aparte precisamente para que no pueda tumbar el cambio de
 * contraseña, que a estas alturas ya se ha completado.
 */
export const avisarCambioContrasena = internalAction({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (_ctx, args): Promise<null> => {
    try {
      await enviarCorreo({
        to: args.email,
        subject: ASUNTO_CAMBIO,
        text: textoCambio(),
        html: htmlCambio(),
      });
    } catch {
      // Sin el correo en el log: es compartido.
      console.error("aviso de cambio: no se pudo enviar");
    }
    return null;
  },
});

const ASUNTO_CAMBIO_CORREO = "El correo de tu cuenta de Vibe CRM ha cambiado";

function textoCambioCorreo(emailNuevo: string): string {
  return `Hola,

El correo con el que entras en Vibe CRM acaba de cambiar a ${emailNuevo}.

A partir de ahora tienes que entrar con esa dirección, y los códigos para
recuperar la contraseña llegarán allí. Esta dirección ya no sirve para entrar.

Si has sido tú, no tienes que hacer nada.

Si NO has sido tú, alguien ha usado tu cuenta: avisa cuanto antes a la
responsable del CRM, que puede devolver el correo a su sitio.

— Vibe CRM`;
}

function htmlCambioCorreo(emailNuevo: string): string {
  const nuevo = escaparHtml(emailNuevo);
  return `<div style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:17px;font-weight:600">Vibe CRM</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      El correo con el que entras en Vibe CRM acaba de cambiar a
      <strong>${nuevo}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      A partir de ahora tienes que entrar con esa dirección, y los códigos para
      recuperar la contraseña llegarán allí. Esta dirección ya no sirve para
      entrar.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      Si has sido tú, no tienes que hacer nada.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#78716c">
      Si no has sido tú, alguien ha usado tu cuenta: avisa cuanto antes a la
      responsable del CRM, que puede devolver el correo a su sitio.
    </p>
  </div>
</div>`;
}

/**
 * Aviso de que el correo de acceso ha cambiado (TAL-61).
 *
 * Va al buzón ANTERIOR, que es la parte que importa: si quien hizo el cambio no
 * fue la persona, el correo nuevo está en manos ajenas y avisar allí no serviría
 * de nada. Este es el único aviso que llega a un sitio que el atacante ya no
 * controla, y por eso dice a quién acudir.
 *
 * Lo programa `cuenta.guardarMisDatos` con el scheduler, después de que el
 * cambio se haya aplicado. Entrega best-effort: un fallo de Resend se registra y
 * no deshace nada.
 */
export const avisarCambioCorreo = internalAction({
  args: { email: v.string(), emailNuevo: v.string() },
  returns: v.null(),
  handler: async (_ctx, args): Promise<null> => {
    try {
      await enviarCorreo({
        to: args.email,
        subject: ASUNTO_CAMBIO_CORREO,
        text: textoCambioCorreo(args.emailNuevo),
        html: htmlCambioCorreo(args.emailNuevo),
      });
    } catch {
      // Sin el correo en el log: es compartido.
      console.error("aviso de cambio de correo: no se pudo enviar");
    }
    return null;
  },
});

const ASUNTO_INVITACION = "Ya tienes acceso a Vibe CRM";

/**
 * El nombre lo escribe la dueña en un formulario y acaba dentro del HTML del
 * correo. Un cliente de correo no ejecuta JavaScript, pero sí interpreta las
 * etiquetas: sin escapar, un nombre con `<` podría descolocar el mensaje o
 * colar un enlace. Es el único dato de entrada libre que va al HTML.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Dirección pública de la aplicación, para poder decirle a la persona dónde
 * entrar. Es un valor de presentación, no un secreto; el respaldo evita que un
 * despliegue sin configurar mande un correo que no lleva a ninguna parte.
 */
function sitio(): string {
  return (
    process.env.SITIO_URL ?? "https://mi-crm-vibecoder-production.up.railway.app"
  );
}

function textoInvitacion(nombre: string): string {
  return `Hola, ${nombre}:

Ya tienes acceso a Vibe CRM.

Para entrar por primera vez, abre esta dirección:

${sitio()}/login

Escribe ahí este mismo correo y te mandaremos un código para que elijas tu
contraseña. Ese código caduca a los 10 minutos; si se te pasa, vuelve a escribir
tu correo y te llegará otro.

Si prefieres entrar con Google y esta dirección es tu cuenta de Google, puedes
usar directamente el botón "Entrar con Google".

— Vibe CRM`;
}

/**
 * Igual que el resto de correos del producto: NINGÚN enlace de un solo uso.
 *
 * No es una manía. Los antivirus y los filtros de correo corporativos abren los
 * enlaces antes que la persona para inspeccionarlos, así que un enlace mágico o
 * un código incrustado en la URL llegaría ya gastado y la persona no podría
 * entrar sin saber por qué. Aquí lo único que viaja es la dirección de la
 * pantalla de acceso, que es una página normal: abrirla mil veces no consume
 * nada. El código se emite después, cuando la persona lo pide de verdad.
 */
function htmlInvitacion(nombre: string): string {
  const url = `${sitio()}/login`;
  const quien = escaparHtml(nombre);
  return `<div style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:17px;font-weight:600">Vibe CRM</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      Hola, ${quien}: ya tienes acceso a Vibe CRM.
    </p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.5">
      Para entrar por primera vez, abre esta dirección:
    </p>
    <p style="margin:0 0 20px;padding:14px;background:#f5f5f4;border-radius:8px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;word-break:break-all">
      ${url}
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      Escribe ahí este mismo correo y te mandaremos un código para que elijas tu
      contraseña. Caduca a los 10 minutos; si se te pasa, vuelve a escribir tu
      correo y te llegará otro.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#78716c">
      Si prefieres entrar con Google y esta dirección es tu cuenta de Google,
      puedes usar directamente el botón «Entrar con Google».
    </p>
  </div>
</div>`;
}

/**
 * Invitación a entrar por primera vez (TAL-60).
 *
 * La programa `usuarios.invitar` con el scheduler, y por eso su fallo no puede
 * deshacer el alta: para cuando esto corre, la persona ya existe y puede entrar
 * por su cuenta. Entrega best-effort, igual que el aviso de cambio.
 *
 * No lleva el código dentro a propósito: entre que se manda el correo y la
 * persona lo lee pueden pasar horas, y el código dura 10 minutos. Se emite
 * cuando escribe su correo en la pantalla de acceso, que es cuando de verdad lo
 * va a usar.
 */
export const invitarUsuario = internalAction({
  args: { email: v.string(), nombre: v.string() },
  returns: v.null(),
  handler: async (_ctx, args): Promise<null> => {
    try {
      await enviarCorreo({
        to: args.email,
        subject: ASUNTO_INVITACION,
        text: textoInvitacion(args.nombre),
        html: htmlInvitacion(args.nombre),
      });
    } catch {
      // Sin el correo en el log: es compartido.
      console.error("invitación: no se pudo enviar");
    }
    return null;
  },
});
