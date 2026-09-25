// Terreno de Juárez: poligonal en metros locales (origen en la esquina suroeste, x al este, y al norte) y su
// conversión a coordenadas geográficas. Sin alias: lo usa el script que escribe public/fixtures/desarrollo/terreno.kmz.
export const ORIGEN_TERRENO = { lat: 31.7192, lng: -106.4242 };

// Frente de 95 m sobre Blvd. Tomás Fernández (lado sur), fondo de 58 m y un pancoupé en la esquina noreste.
export const POLIGONAL_M: [number, number][] = [
  [0, 0],
  [95, 0],
  [95, 52],
  [82, 58],
  [0, 58],
];

// Huella del edificio y del estacionamiento del anteproyecto (en los mismos metros locales).
export const HUELLA_EDIFICIO_M: [number, number][] = [
  [10, 30],
  [70, 30],
  [70, 50],
  [10, 50],
];
export const ESTACIONAMIENTO_M: [number, number][] = [
  [8, 6],
  [88, 6],
  [88, 26],
  [8, 26],
];

const M_POR_GRADO_LAT = 111_320;
const M_POR_GRADO_LNG = 111_320 * Math.cos((ORIGEN_TERRENO.lat * Math.PI) / 180);

export function aGeografica([x, y]: [number, number]): { lat: number; lng: number } {
  return { lat: ORIGEN_TERRENO.lat + y / M_POR_GRADO_LAT, lng: ORIGEN_TERRENO.lng + x / M_POR_GRADO_LNG };
}

// Área por la fórmula del zapato (m²).
export function areaPoligono(p: [number, number][]) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

export const SUPERFICIE_TERRENO_M2 = areaPoligono(POLIGONAL_M);
