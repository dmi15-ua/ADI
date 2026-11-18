// Compara los datos originales de un coche con los del formulario y devuelve solo los campos que han cambiado.
// null, undefined y el texto vacío se consideran iguales (un coche sin descripción es lo mismo que una descripción vacía).
function iguales(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
  return (a ?? '') === (b ?? '')
}

export function diferencias(original, nuevos) {
  const cambios = {}
  for (const [campo, valor] of Object.entries(nuevos)) {
    if (!iguales(original[campo], valor)) cambios[campo] = valor
  }
  return cambios
}
