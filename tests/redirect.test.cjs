const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const script = readFileSync("redirect.js", "utf8");

function redirect(path) {
  const location = new URL(path, "https://atimics.github.io");
  let target;
  location.replace = (value) => { target = value; };
  vm.runInNewContext(script, { location, URL });
  return target;
}

test("preserves paths, queries, and chart anchors", () => {
  assert.equal(redirect("/nanogpt-macbook"), "https://cenetex.github.io/nanogpt-macbook/");
  assert.equal(redirect("/nanogpt-macbook/?preset=tiny#results"), "https://cenetex.github.io/nanogpt-macbook/?preset=tiny#results");
  assert.equal(redirect("/nanogpt-macbook/data/benchmarks.json"), "https://cenetex.github.io/nanogpt-macbook/data/benchmarks.json");
});

test("keeps other project paths on the original site", () => {
  assert.equal(redirect("/another-project/"), undefined);
  assert.equal(redirect("/nanogpt-macbook-extra/"), undefined);
});
