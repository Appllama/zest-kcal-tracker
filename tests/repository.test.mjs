import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
const root = fileURLToPath(new URL("../", import.meta.url));
const text = (path) => readFileSync(resolve(root, path), "utf8");
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

test("asset inventory is complete, checksum-valid and contains no retired stock photo", () => {
  const manifest = JSON.parse(text("docs/asset-manifest.json"));
  assert.deepEqual(
    manifest.map((item) => item.path).sort(),
    files(resolve(root, "assets"))
      .map((path) => relative(root, path))
      .sort(),
  );
  for (const item of manifest) {
    const bytes = readFileSync(resolve(root, item.path));
    assert.equal(bytes.length, item.bytes, item.path);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      item.sha256,
      item.path,
    );
  }
  assert.equal(manifest.filter((item) => item.path.endsWith(".svg")).length, 6);
  assert.equal(
    manifest.filter((item) => item.path.includes("/photos/")).length,
    3,
  );
});

test("every relative source import and artwork reference resolves within this project", () => {
  const sources = files(resolve(root, "src"));
  for (const source of sources) {
    const content = readFileSync(source, "utf8");
    for (const match of content.matchAll(
      /(?:from\s+|require\()["'](\.[^"']+)["']/g,
    )) {
      const target = resolve(dirname(source), match[1]);
      assert.ok(target.startsWith(root), `${source} escapes the project`);
      assert.ok(
        ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].some((ext) =>
          existsSync(target + ext),
        ),
        `${source}: ${match[1]}`,
      );
    }
  }
  assert.ok(!sources.some((path) => /\/(plain|kin|companion)\//.test(path)));
});

test("published Markdown uses valid local file links and previews", () => {
  const docs = [
    ...files(resolve(root, "docs")),
    ...files(resolve(root, "prompts")),
    resolve(root, "README.md"),
    resolve(root, "NOTICE.md"),
  ].filter((path) => path.endsWith(".md"));
  for (const doc of docs) {
    const content = readFileSync(doc, "utf8");
    for (const match of content.matchAll(
      /(?:\]\(|src=")([^\s)"#]+)(?:#[^)"\s]*)?[)"]/g,
    )) {
      if (/^(https?:|mailto:|data:)/.test(match[1])) continue;
      assert.ok(
        existsSync(resolve(dirname(doc), match[1])),
        `${relative(root, doc)}: ${match[1]}`,
      );
    }
  }
});

test("root mounts only Zest and keeps sample seeding explicit", () => {
  const routes = files(resolve(root, "src/app"))
    .map((path) => relative(root, path))
    .sort();
  assert.deepEqual(routes, ["src/app/_layout.tsx", "src/app/index.tsx"]);
  assert.match(text("src/app/index.tsx"), /demo={demo === "1"}/);
  const screen = text("src/cookbooks/zest/screens/ZestScreen.tsx");
  assert.doesNotMatch(
    screen,
    /router\.back|Back to chat collection|useMotionMetrics/,
  );
  assert.match(screen, /if \(demo\) useDiary\.getState\(\)\.seedDemo\(\)/);
});
