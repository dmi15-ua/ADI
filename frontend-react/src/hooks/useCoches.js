import { useCallback, useEffect, useRef, useState } from 'react'
import { buscarCoches } from '../servicios/services/cocheService.js'
import { mensajeDeError } from '../utils/errores.js'

// Listado paginado de coches. El servidor devuelve cada página con el total; aquí solo se guarda la página actual.
// Equivale a la tienda `coches` de Pinia del frontend en Vue, pero como un hook: cada componente que lo usa tiene su propio estado.
export function useCoches(porPagina = 9) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ items: [], total: 0, totalPaginas: 0, cargando: true, error: '' })

  // Si se piden varias páginas seguidas, solo cuenta la respuesta de la última petición
  const ultimaPeticion = useRef(0)

  const cargar = useCallback(
    async (numeroDePagina) => {
      const numero = ++ultimaPeticion.current
      setEstado((anterior) => ({ ...anterior, cargando: true, error: '' }))
      try {
        const resultado = await buscarCoches({ pagina: numeroDePagina, porPagina })
        if (numero !== ultimaPeticion.current) return
        setEstado({ items: resultado.datos, total: resultado.total, totalPaginas: resultado.totalPaginas, cargando: false, error: '' })
      } catch (fallo) {
        if (numero !== ultimaPeticion.current) return
        setEstado({ items: [], total: 0, totalPaginas: 0, cargando: false, error: mensajeDeError(fallo, 'No se pudo cargar el listado de coches') })
      }
    },
    [porPagina]
  )

  // Cada vez que cambia la página se vuelve a pedir
  useEffect(() => {
    cargar(pagina)
  }, [pagina, cargar])

  // Si se pide una página que ya no existe (por ejemplo, tras eliminar el último coche de la última página), se va a la última que quede
  useEffect(() => {
    if (!estado.cargando && !estado.error && estado.items.length === 0 && estado.total > 0 && pagina > estado.totalPaginas) {
      setPagina(estado.totalPaginas)
    }
  }, [estado, pagina])

  const recargar = useCallback(() => cargar(pagina), [cargar, pagina])

  return { ...estado, pagina, porPagina, irAPagina: setPagina, recargar }
}
