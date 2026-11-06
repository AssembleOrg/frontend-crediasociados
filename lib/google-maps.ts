// Mismas opciones en todos los useLoadScript: el loader de Google no admite
// cargarse dos veces con opciones distintas.
export const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places']
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
