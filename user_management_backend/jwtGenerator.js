const crypto = require("crypto");

const secretKey = crypto.randomBytes(64).toString("base64");

console.log("JWT Secret Key:", secretKey);
