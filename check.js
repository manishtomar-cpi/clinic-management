const crypto = require('crypto');

// Hashing function using SHA-256
const hashPassword = (password) => {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
};

// Example usage
const plainTextPassword = 'password123';
const hashedPassword = hashPassword(plainTextPassword);
console.log('Hashed password:', hashedPassword);
