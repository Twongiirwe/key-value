const assert = require("node:assert");
const KeyValueStore = require("./kvStore");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const kv = new KeyValueStore();

  // set + get without TTL
  kv.set("name", "Susan");
  assert.strictEqual(kv.get("name"), "Susan");

  // stores any value type
  kv.set("user", { id: 1, tags: ["a", "b"] });
  assert.deepStrictEqual(kv.get("user"), { id: 1, tags: ["a", "b"] });

  // missing key returns null
  assert.strictEqual(kv.get("missing"), null);

  // overwrite
  kv.set("name", "Updated");
  assert.strictEqual(kv.get("name"), "Updated");

  // TTL: alive before expiry, null after
  kv.set("session", "abc123", 100);
  assert.strictEqual(kv.get("session"), "abc123");
  await sleep(150);
  assert.strictEqual(kv.get("session"), null);

  // overwriting without a TTL removes the old expiry
  kv.set("token", "x", 50);
  kv.set("token", "y");
  await sleep(80);
  assert.strictEqual(kv.get("token"), "y");

  // delete
  kv.set("temp", 1);
  assert.strictEqual(kv.delete("temp"), true);
  assert.strictEqual(kv.get("temp"), null);
  assert.strictEqual(kv.delete("temp"), false);

  // deleting an already-expired key reports false
  kv.set("old", 1, 20);
  await sleep(50);
  assert.strictEqual(kv.delete("old"), false);

  // invalid TTL values are rejected
  assert.throws(() => kv.set("bad", 1, -5), TypeError);
  assert.throws(() => kv.set("bad", 1, "soon"), TypeError);
  assert.throws(() => kv.set("bad", 1, 0), TypeError);

  // falsy values are stored correctly (0, false, empty string)
  kv.set("zero", 0);
  kv.set("no", false);
  kv.set("empty", "");
  assert.strictEqual(kv.get("zero"), 0);
  assert.strictEqual(kv.get("no"), false);
  assert.strictEqual(kv.get("empty"), "");

  // size ignores expired keys
  const kv2 = new KeyValueStore();
  kv2.set("a", 1);
  kv2.set("b", 2, 30);
  await sleep(60);
  assert.strictEqual(kv2.size, 1);

  // background cleanup removes expired keys without any get()
  const kv3 = new KeyValueStore(25);
  kv3.set("x", 1, 20);
  await sleep(100);
  assert.strictEqual(kv3.store.size, 0);
  kv3.destroy();

  console.log("All tests passed");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
