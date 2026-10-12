# In-Memory Key-Value Store (Node.js)

A small, fast, Redis-like key-value store that keeps data in memory using a JavaScript `Map`. Keys can expire after a time-to-live (TTL). No dependencies.

## Video walkthrough

**Code explanation (5 min):** https://REPLACE-WITH-YOUR-PUBLIC-VIDEO-URL

## Usage

```js
const KeyValueStore = require("./kvStore");

const kv = new KeyValueStore();

kv.set("name", "Susan");          // no expiry
kv.set("otp", "482913", 5000);    // expires in 5000 ms (5 s)

kv.get("name");                   // "Susan"
kv.get("otp");                    // "482913", or null once 5 s have passed
kv.delete("name");                // true (key existed)
kv.get("name");                   // null
```

## API

| Method | Description |
|--------|-------------|
| `set(key, value, ttl)` | Saves a value. `ttl` is optional, in **milliseconds**. Omit it for a key that never expires. Throws `TypeError` if `ttl` is not a positive number. Returns the store so calls can be chained. |
| `get(key)` | Returns the value, or `null` if the key is missing or expired. |
| `delete(key)` | Removes the key. Returns `true` if a live key was removed, `false` otherwise. |
| `size` | Number of keys that have not expired. |
| `cleanup()` | Removes all expired keys now. |
| `destroy()` | Stops the background timer and empties the store. |

Optional: `new KeyValueStore(1000)` starts a background sweep every 1000 ms that removes expired keys nobody reads again. The default is no sweep.

## How expiration works

Each entry is stored as `{ value, expiresAt }`, where `expiresAt` is a timestamp (or `null`).

1. **Lazy expiration:** `get` checks the timestamp and deletes the entry if it has expired. This costs nothing extra for keys that are never expired.
2. **Optional background sweep:** removes expired keys that are never read again, so memory does not grow forever. The timer is `unref()`'d so it never keeps the Node process alive.

This is the same idea Redis uses (lazy + periodic expiry).

## Run

Requires Node.js 16 or newer.

```bash
node test.js   # runs the tests
node demo.js   # short demo
```

## Files

| File | Purpose |
|------|---------|
| `kvStore.js` | The `KeyValueStore` class |
| `test.js` | Tests using Node's built-in `assert` |
| `demo.js` | Small usage example |
| `VIDEO_SCRIPT.md` | Talking points for the walkthrough video |

## Limitations

Data lives only in memory, so it is lost when the process exits. It is single-process and has no persistence or size limit.
# key-value