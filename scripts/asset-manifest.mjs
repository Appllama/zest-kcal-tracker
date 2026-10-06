import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
function list(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(folder, entry.name);
    return entry.isDirectory() ? list(path) : [path];
  });
}
const assets = list(resolve(root, "assets"))
  .sort()
  .map((path) => {
    const bytes = readFileSync(path);
    return {
      path: relative(root, path),
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  });
writeFileSync(
  resolve(root, "docs/asset-manifest.json"),
  JSON.stringify(assets, null, 2) + "\n",
);
console.log(`Inventoried ${assets.length} original assets.`);
