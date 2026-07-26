const jwt = require('jsonwebtoken');
const secret = "FeNaZPnXbMRIMZd/gAr6S3EZsf3+vAMNzB0/nTaqllBBxcmeQEhO14FdH6GOhUbjtQb2NlbYOjf4nEsSxZveaw==";

const token = jwt.sign({ aud: "authenticated", role: "authenticated" }, secret);
console.log("Token:", token);

try {
  jwt.verify(token, secret);
  console.log("Verified string secret OK");
} catch (e) {
  console.error("String secret failed:", e.message);
}

