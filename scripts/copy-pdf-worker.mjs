// Copia el worker de PDF.js (dependencia de react-pdf) a public/ para que el visor lo cargue.
// Se resuelve desde react-pdf porque pnpm no expone pdfjs-dist en la raíz.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const reactPdfDir = dirname(require.resolve("react-pdf"));
const pdfjsDir = dirname(require.resolve("pdfjs-dist/package.json", { paths: [reactPdfDir] }));

mkdirSync("public", { recursive: true });
copyFileSync(join(pdfjsDir, "build", "pdf.worker.min.mjs"), join("public", "pdf.worker.min.mjs"));
console.log(`pdf.worker.min.mjs copiado (pdfjs-dist ${require(join(pdfjsDir, "package.json")).version})`);
