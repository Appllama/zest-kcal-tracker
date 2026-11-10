const assert = require("node:assert/strict");
const test = require("node:test");

const xcode = require("xcode");

test("Xcode tooling still generates unique uppercase 24-character project identifiers", () => {
  const project = xcode.project("compatibility.xcodeproj/project.pbxproj");
  project.hash = { project: { objects: {} } };
  const identifiers = Array.from({ length: 128 }, () => project.generateUuid());
  assert.equal(new Set(identifiers).size, identifiers.length);
  for (const identifier of identifiers) {
    assert.match(identifier, /^[0-9A-F]{12}4[0-9A-F]{3}[89AB][0-9A-F]{7}$/);
  }
});
