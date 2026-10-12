const KeyValueStore = require("./kvStore");

const kv = new KeyValueStore(1000); // sweep expired keys every second

kv.set("username", "susan"); // never expires
kv.set("otp", "482913", 2000); // expires in 2 seconds

console.log("username:", kv.get("username")); // susan
console.log("otp:", kv.get("otp")); // 482913

setTimeout(() => {
  console.log("otp after 2.5s:", kv.get("otp")); // null
  console.log("delete username:", kv.delete("username")); // true
  console.log("username after delete:", kv.get("username")); // null
  kv.destroy();
}, 2500);
