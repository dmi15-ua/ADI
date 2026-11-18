// En los listados solo se necesita la foto principal (o la primera si ninguna está marcada)
export function resumirCoche({ foto_coche, ...coche }) {
  const fotos = [...foto_coche].sort((a, b) => a.orden - b.orden)
  const principal = fotos.find((f) => f.es_principal) ?? fotos[0]
  return { ...coche, foto_principal: principal?.url ?? null }
}
