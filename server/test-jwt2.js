const jwt = require('jsonwebtoken');
const secretStr = "FeNaZPnXbMRIMZd/gAr6S3EZsf3+vAMNzB0/nTaqllBBxcmeQEhO14FdH6GOhUbjtQb2NlbYOjf4nEsSxZveaw==";

// Sign with Buffer
const token = jwt.sign({ aud: "authenticated", role: "authenticated" }, Buffer.from(secretStr, 'base64'));

try {
  jwt.verify(token, secretStr);
  console.log("Verified with string!");
} catch (e) {
  console.log("Failed with string:", e.message);
}

try {
  jwt.verify(token, Buffer.from(secretStr, 'base64'));
  console.log("Verified with Buffer!");
} catch (e) {
  console.log("Failed with Buffer:", e.message);
}
