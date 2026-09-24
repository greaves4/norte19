import type { Categoria } from "@/lib/types/fund";

// 38 categorías de comercio tipo MCC con un mapeo acotado a claves producto/servicio del catálogo SAT.
// Mapeo de demostración (~60 claves): en producción se define con Tesorería.
export const CATEGORIAS: Categoria[] = [
  { id: "aerolineas", nombre: "Aerolíneas", mcc: "4511", clavesProdServ: ["78111501", "78111502"], bloqueadaPorDefecto: true },
  { id: "casinos", nombre: "Casinos y apuestas", mcc: "7995", clavesProdServ: ["90151802"], bloqueadaPorDefecto: true },
  { id: "joyerias", nombre: "Joyerías", mcc: "5944", clavesProdServ: ["54101500", "54101600"], bloqueadaPorDefecto: true },
  { id: "entretenimiento-adulto", nombre: "Entretenimiento adulto", mcc: "5967", clavesProdServ: ["90151700"], bloqueadaPorDefecto: true },
  { id: "servicios-financieros", nombre: "Servicios financieros", mcc: "6012", clavesProdServ: ["84121500", "84111600"], bloqueadaPorDefecto: true },
  { id: "restaurantes", nombre: "Restaurantes", mcc: "5812", clavesProdServ: ["90101500", "90101501"], bloqueadaPorDefecto: false },
  { id: "comida-rapida", nombre: "Comida rápida", mcc: "5814", clavesProdServ: ["90101700"], bloqueadaPorDefecto: false },
  { id: "supermercados", nombre: "Supermercados", mcc: "5411", clavesProdServ: ["50192100", "50221200"], bloqueadaPorDefecto: false },
  { id: "ferreterias", nombre: "Ferreterías", mcc: "5251", clavesProdServ: ["27111700", "31161500", "31211500"], bloqueadaPorDefecto: false },
  { id: "materiales-construccion", nombre: "Materiales de construcción", mcc: "5211", clavesProdServ: ["30111600", "30131500"], bloqueadaPorDefecto: false },
  { id: "articulos-limpieza", nombre: "Artículos de limpieza", mcc: "5169", clavesProdServ: ["47131700", "47131800"], bloqueadaPorDefecto: false },
  { id: "servicios-limpieza", nombre: "Servicios de limpieza", mcc: "7349", clavesProdServ: ["76111500", "76111501"], bloqueadaPorDefecto: false },
  { id: "lavanderia", nombre: "Lavandería y tintorería", mcc: "7210", clavesProdServ: ["91111502"], bloqueadaPorDefecto: false },
  { id: "papeleria", nombre: "Papelería y artículos de oficina", mcc: "5943", clavesProdServ: ["44121600", "14111500", "44103100"], bloqueadaPorDefecto: false },
  { id: "computo", nombre: "Equipo de cómputo", mcc: "5732", clavesProdServ: ["43211500", "43211700"], bloqueadaPorDefecto: false },
  { id: "telecomunicaciones", nombre: "Telecomunicaciones", mcc: "4814", clavesProdServ: ["81161700", "83111600"], bloqueadaPorDefecto: false },
  { id: "gasolineras", nombre: "Gasolineras", mcc: "5541", clavesProdServ: ["15101505", "15101514"], bloqueadaPorDefecto: false },
  { id: "gas-lp", nombre: "Gas LP", mcc: "5983", clavesProdServ: ["15111510"], bloqueadaPorDefecto: false },
  { id: "transporte-terrestre", nombre: "Transporte terrestre y taxis", mcc: "4121", clavesProdServ: ["78111800", "78111804"], bloqueadaPorDefecto: false },
  { id: "estacionamientos", nombre: "Estacionamientos", mcc: "7523", clavesProdServ: ["78181700"], bloqueadaPorDefecto: false },
  { id: "mensajeria", nombre: "Mensajería y paquetería", mcc: "4215", clavesProdServ: ["78102200", "78102203"], bloqueadaPorDefecto: false },
  { id: "farmacias", nombre: "Farmacias", mcc: "5912", clavesProdServ: ["51101500", "42311500"], bloqueadaPorDefecto: false },
  { id: "servicios-medicos", nombre: "Servicios médicos", mcc: "8099", clavesProdServ: ["85101500"], bloqueadaPorDefecto: false },
  { id: "plomeria-electricidad", nombre: "Plomería y electricidad", mcc: "1711", clavesProdServ: ["72101500", "72151500"], bloqueadaPorDefecto: false },
  { id: "aire-acondicionado", nombre: "Aire acondicionado y refrigeración", mcc: "7623", clavesProdServ: ["72151200", "40101700"], bloqueadaPorDefecto: false },
  { id: "control-plagas", nombre: "Control de plagas", mcc: "7342", clavesProdServ: ["72102100"], bloqueadaPorDefecto: false },
  { id: "jardineria", nombre: "Jardinería", mcc: "0780", clavesProdServ: ["70111700"], bloqueadaPorDefecto: false },
  { id: "blancos", nombre: "Blancos y textiles", mcc: "5714", clavesProdServ: ["52121500", "52121700"], bloqueadaPorDefecto: false },
  { id: "amenidades", nombre: "Amenidades y cuidado personal", mcc: "5977", clavesProdServ: ["53131500", "53131600"], bloqueadaPorDefecto: false },
  { id: "mobiliario", nombre: "Mobiliario", mcc: "5712", clavesProdServ: ["56101500"], bloqueadaPorDefecto: false },
  { id: "electrodomesticos", nombre: "Electrodomésticos", mcc: "5722", clavesProdServ: ["52141500"], bloqueadaPorDefecto: false },
  { id: "tiendas-departamentales", nombre: "Tiendas departamentales", mcc: "5311", clavesProdServ: ["53101500"], bloqueadaPorDefecto: false },
  { id: "uniformes", nombre: "Uniformes", mcc: "5137", clavesProdServ: ["53102700"], bloqueadaPorDefecto: false },
  { id: "publicidad-impresion", nombre: "Publicidad e impresión", mcc: "7311", clavesProdServ: ["82101500", "82121500"], bloqueadaPorDefecto: false },
  { id: "software", nombre: "Software y suscripciones", mcc: "5734", clavesProdServ: ["43231500", "81112500"], bloqueadaPorDefecto: false },
  { id: "hospedaje", nombre: "Hospedaje", mcc: "7011", clavesProdServ: ["90111800"], bloqueadaPorDefecto: false },
  { id: "agencias-viajes", nombre: "Agencias de viajes", mcc: "4722", clavesProdServ: ["90121500"], bloqueadaPorDefecto: false },
  { id: "donativos", nombre: "Donativos y organizaciones", mcc: "8398", clavesProdServ: ["94131500"], bloqueadaPorDefecto: false },
];

export const CATEGORIAS_BLOQUEADAS_POR_DEFECTO = CATEGORIAS.filter((c) => c.bloqueadaPorDefecto).map((c) => c.id);

export function categoriaPorClave(claveProdServ: string) {
  return CATEGORIAS.find((c) => c.clavesProdServ.includes(claveProdServ));
}

export function categoriaPorId(id: string) {
  return CATEGORIAS.find((c) => c.id === id);
}
