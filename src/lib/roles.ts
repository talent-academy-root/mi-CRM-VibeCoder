/**
 * Los dos roles del negocio, con el nombre que se les da en pantalla.
 *
 * Vive aquí y no dentro de un componente porque lo usan la barra lateral, el
 * panel de equipo y el formulario de alta: el día que cambie el nombre visible
 * de un rol, tiene que cambiar en un solo sitio.
 */

export type Rol = "propietaria" | "comercial";

export const ROL_LABEL: Record<Rol, string> = {
  propietaria: "Dueña",
  comercial: "Atiende y vende",
};

/** Para el selector de rol del formulario de usuario (D12). */
export const ROL_OPCIONES: ReadonlyArray<{ value: Rol; label: string }> = [
  { value: "propietaria", label: ROL_LABEL.propietaria },
  { value: "comercial", label: ROL_LABEL.comercial },
];
