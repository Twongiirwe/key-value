class KeyValueStore {
  constructor(cleanupIntervalMs = 0) {
    // Map<key, { value, expiresAt }>. expiresAt is null when the key never expires.
    this.store = new Map();
    this.cleanupTimer = null;

    // Optional background sweep that removes expired keys nobody reads again.
    if (cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
      this.cleanupTimer.unref(); // don't keep the Node process alive just for this timer
    }
  }

  // ttl is in milliseconds. Leave it out (or pass null) for a key that never expires.
  set(key, value, ttl) {
    if (ttl !== undefined && ttl !== null) {
      if (typeof ttl !== "number" || !Number.isFinite(ttl) || ttl <= 0) {
        throw new TypeError("ttl must be a positive number of milliseconds");
      }
    }

    const expiresAt = ttl ? Date.now() + ttl : null;
    this.store.set(key, { value, expiresAt });
    return this;
  }

  // Returns the value, or null if the key is missing or has expired.
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.store.delete(key); // lazy expiration: clean up on access
      return null;
    }
    return entry.value;
  }

  // Returns true if a live key was removed, false otherwise.
  delete(key) {
    const entry = this.store.get(key);
    if (!entry) return false;

    const wasLive = !this.isExpired(entry);
    this.store.delete(key);
    return wasLive;
  }

  // Number of keys that have not expired.
  get size() {
    this.cleanup();
    return this.store.size;
  }

  // Remove every expired key.
  cleanup() {
    for (const [key, entry] of this.store) {
      if (this.isExpired(entry)) this.store.delete(key);
    }
  }

  // Stop the background timer (if any) and empty the store.
  destroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.store.clear();
  }

  isExpired(entry) {
    return entry.expiresAt !== null && Date.now() >= entry.expiresAt;
  }
}

module.exports = KeyValueStore;
