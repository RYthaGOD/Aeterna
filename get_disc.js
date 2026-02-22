const crypto = require("crypto");
function getDiscriminator(name) {
    return crypto.createHash("sha256").update(name).digest().subarray(0, 8);
}
console.log("grant_xp (hex):", getDiscriminator("global:grant_xp").toString("hex"));
console.log("update_soul (hex):", getDiscriminator("global:update_soul").toString("hex"));
