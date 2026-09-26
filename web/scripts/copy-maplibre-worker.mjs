/**
 * Copies MapLibre GL JS's Web Worker bundle into `public/`.
 *
 * MapLibre loads its tile worker from a separate module that imports
 * `./maplibre-gl-shared.mjs` as a sibling. Turbopack emits the worker via
 * `new URL(..., import.meta.url)` but does not rewrite that internal relative
 * import, so the sibling 404s and the worker never starts — the map renders no
 * tiles and logs "Worker failed to load".
 *
 * Serving the worker and its relative dependencies from `public/` preserves the
 * sibling layout it expects. Files are generated on every dev/build run rather
 * than committed, so they always match the installed MapLibre version.
 */
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const ENTRY = "maplibre-gl-worker.mjs";

/** Walk the relative-import graph starting from the worker entry point. */
async function collectWorkerFiles(distDir) {
  const seen = new Set();
  const queue = [ENTRY];

  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);

    const contents = await readFile(join(distDir, file), "utf8");

    for (const match of contents.matchAll(
      /(?:from|import)\s*\(?\s*["']\.\/([^"']+\.(?:mjs|js))["']/g,
    )) {
      if (!seen.has(match[1])) queue.push(match[1]);
    }
  }

  return [...seen];
}

async function main() {
  const distDir = dirname(
    require.resolve(`maplibre-gl/dist/${ENTRY}`),
  );
  const outDir = join(projectRoot, "public", "maplibre");

  const files = await collectWorkerFiles(distDir);
  await mkdir(outDir, { recursive: true });

  for (const file of files) {
    await copyFile(join(distDir, file), join(outDir, file));
  }

  console.log(
    `maplibre: staged ${files.length} worker file(s) in public/maplibre (${files.join(", ")})`,
  );
}

main().catch((error) => {
  console.error("maplibre: failed to stage worker files:", error);
  process.exit(1);
});
