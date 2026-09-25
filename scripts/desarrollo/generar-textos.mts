// Genera las memorias y catálogos de ejemplo del corpus de Desarrollo como texto plano:
// - lib/fixtures/desarrollo/corpus/textos/<hotel>-<disciplina>.txt   páginas separadas por \f
// - lib/fixtures/desarrollo/corpus/textos/textos.json                mismo texto por página, para el índice de búsqueda
// Uso: pnpm gen:desarrollo
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CORPUS } from "../../lib/fixtures/desarrollo/corpus/index.ts";
import { redactarHotel } from "../../lib/fixtures/desarrollo/corpus/redaccion.ts";

const DIR = join(import.meta.dirname, "..", "..", "lib", "fixtures", "desarrollo", "corpus", "textos");
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

const todos: Record<string, string[]> = {};
for (const hotel of CORPUS) {
  for (const [id, paginas] of Object.entries(redactarHotel(hotel))) {
    todos[id] = paginas;
    writeFileSync(join(DIR, `${id}.txt`), `${paginas.join("\n\f\n")}\n`);
  }
}
writeFileSync(join(DIR, "textos.json"), `${JSON.stringify(todos)}\n`);
console.log(`${Object.keys(todos).length} documentos, ${Object.values(todos).reduce((t, p) => t + p.length, 0)} páginas en ${DIR}`);
