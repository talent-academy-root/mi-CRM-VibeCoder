import { Email } from "@convex-dev/auth/providers/Email";
import { enviarCorreo, REMITENTE } from "./correo";

/**
 * Proveedor del código de un solo uso para recuperar la contraseña (TAL-65).
 *
 * Se enchufa en `Password({ reset: CodigoRecuperacion })` de convex/auth.ts y
 * NUNCA en `providers[]`: registrado ahí, el código pasaría a ser un login sin
 * contraseña que además no invalidaría las demás sesiones.
 *
 * Este módulo NO debe importar `./_generated/api`: lo importa `auth.ts`, y el
 * ciclo rompe la inferencia de tipos de Convex.
 */

const MINUTOS_VALIDEZ = 10;

// Crockford Base32: sin I, L, O ni U, para que nadie confunda un 1 con una I ni
// un 0 con una O al copiar el código a mano.
const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LARGO_CODIGO = 8;

/**
 * Código de 8 caracteres (32^8 ≈ 1,1 billones de combinaciones).
 *
 * La longitud NO es estética: `verifyCodeAndSignIn` de la librería solo aplica
 * su rate limit cuando la llamada incluye `email`, y la ruta pública de
 * `signIn` permite verificar un código sin mandarlo. Además, al pertenecer este
 * código a un `extraProvider`, acertar lanza (y el rollback de la mutation deja
 * el código sin consumir), así que un atacante puede probar sin límite y
 * distinguir acierto de fallo. Con 6 dígitos eso se agota en horas; con 40 bits
 * de entropía deja de ser viable.
 *
 * Dicho de otro modo, y conviene tenerlo presente antes de tocar nada de aquí:
 * el canje del código NO está protegido por ningún límite de intentos. Sus
 * únicas defensas son estos 40 bits y los 10 minutos de validez. Riesgo
 * aceptado en TAL-67; la señal de que alguien lo está intentando es la línea
 * "Invalid verification code" (nivel INFO) en los logs de Convex.
 *
 * `byte % 32` es uniforme porque 256 es múltiplo exacto de 32: no hace falta
 * descartar muestras para evitar sesgo.
 */
function generarCodigo(): string {
  const bytes = new Uint8Array(LARGO_CODIGO);
  crypto.getRandomValues(bytes);
  let codigo = "";
  for (const byte of bytes) {
    codigo += ALFABETO[byte % ALFABETO.length];
  }
  return codigo;
}

/** `K7M4P2XR` → `K7M4-P2XR`, solo para mostrarlo en el correo. */
function conGuion(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

function textoPlano(codigo: string): string {
  return `Hola,

Has pedido cambiar la contraseña de Vibe CRM. Este es tu código:

${conGuion(codigo)}

Caduca en ${MINUTOS_VALIDEZ} minutos. Escríbelo en la pantalla de inicio de
sesión y elige una contraseña nueva.

Al cambiarla se cerrará la sesión en tus otros dispositivos.

Si no has sido tú, ignora este correo: tu contraseña no cambia hasta que
alguien use el código.

— Vibe CRM`;
}

/**
 * HTML con estilos en línea y colores literales: las clases de Tailwind y las
 * variables CSS del producto no llegan a un cliente de correo. Sin imágenes ni
 * pixel de seguimiento (mejor entregabilidad y nada que bloquear).
 */
function cuerpoHtml(codigo: string): string {
  return `<div style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:17px;font-weight:600">Vibe CRM</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5">
      Has pedido cambiar tu contraseña. Este es tu código:
    </p>
    <p style="margin:0 0 20px;padding:16px;background:#f5f5f4;border-radius:8px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:30px;font-weight:600;letter-spacing:6px">
      ${conGuion(codigo)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
      Caduca en ${MINUTOS_VALIDEZ} minutos. Escríbelo en la pantalla de inicio de
      sesión y elige una contraseña nueva.
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#78716c">
      Al cambiarla se cerrará la sesión en tus otros dispositivos.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#78716c">
      Si no has sido tú, ignora este correo: tu contraseña no cambia hasta que
      alguien use el código.
    </p>
  </div>
</div>`;
}

// Sin parámetro de tipo a propósito: `PasswordConfig.reset` exige
// `EmailConfig<GenericDataModel>` y el genérico es invariante, así que
// `Email<DataModel>` produce un tipo que no encaja en `Password({ reset })`.
export const CodigoRecuperacion = Email({
  id: "codigo-recuperacion",
  from: REMITENTE,
  maxAge: MINUTOS_VALIDEZ * 60,

  generateVerificationToken: async () => generarCodigo(),

  // Mismo contrato que el `authorize` de serie (un código corto exige que el
  // correo acompañe a la verificación), pero comparando en forma canónica: la
  // versión de la librería compara el string crudo contra `providerAccountId`,
  // así que escribir el correo con otra capitalización fallaba con un error
  // incomprensible.
  //
  // Acepta los dos nombres del campo: el canje manda `correo` (ver auth.ts y
  // RecuperarContrasena.tsx) y un frontend antiguo todavía manda `email`.
  authorize: async (params, cuenta) => {
    const email = String(params.email ?? params.correo ?? "")
      .trim()
      .toLowerCase();
    if (email === "" || email !== cuenta.providerAccountId) {
      throw new Error("Invalid code");
    }
  },

  // El envío vive en `correo.ts`, compartido con el aviso de cambio de
  // contraseña. Sus fallos llegan aquí como ConvexError, que es lo que
  // `recuperacion.solicitarCodigo` necesita para liberar la reserva de cuota.
  //
  // Se manda `token` y jamás la `url` que la librería construye con el código
  // como query param: acabaría en el historial y en la cabecera Referer.
  sendVerificationRequest: async ({ identifier: email, token }) => {
    await enviarCorreo({
      to: email,
      subject: `${conGuion(token)} es tu código de Vibe CRM`,
      text: textoPlano(token),
      html: cuerpoHtml(token),
    });
  },
});
