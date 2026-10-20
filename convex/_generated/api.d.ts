/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as acceso from "../acceso.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as clientes from "../clientes.js";
import type * as codigoRecuperacion from "../codigoRecuperacion.js";
import type * as contrasenas from "../contrasenas.js";
import type * as correo from "../correo.js";
import type * as crons from "../crons.js";
import type * as cuenta from "../cuenta.js";
import type * as fechas from "../fechas.js";
import type * as http from "../http.js";
import type * as identidad from "../identidad.js";
import type * as interacciones from "../interacciones.js";
import type * as invitacion from "../invitacion.js";
import type * as mensajes from "../mensajes.js";
import type * as nombres from "../nombres.js";
import type * as recuperacion from "../recuperacion.js";
import type * as seed from "../seed.js";
import type * as seguimientos from "../seguimientos.js";
import type * as soporte from "../soporte.js";
import type * as usuarios from "../usuarios.js";
import type * as ventas from "../ventas.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  acceso: typeof acceso;
  auth: typeof auth;
  authz: typeof authz;
  clientes: typeof clientes;
  codigoRecuperacion: typeof codigoRecuperacion;
  contrasenas: typeof contrasenas;
  correo: typeof correo;
  crons: typeof crons;
  cuenta: typeof cuenta;
  fechas: typeof fechas;
  http: typeof http;
  identidad: typeof identidad;
  interacciones: typeof interacciones;
  invitacion: typeof invitacion;
  mensajes: typeof mensajes;
  nombres: typeof nombres;
  recuperacion: typeof recuperacion;
  seed: typeof seed;
  seguimientos: typeof seguimientos;
  soporte: typeof soporte;
  usuarios: typeof usuarios;
  ventas: typeof ventas;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
