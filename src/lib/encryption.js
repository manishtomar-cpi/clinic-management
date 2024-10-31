
import CryptoJS from 'crypto-js';

// Access the secret key from environment variables
const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY;

if (!SECRET_KEY) {
  // console.error('SECRET_KEY is not defined. Please set NEXT_PUBLIC_SECRET_KEY in your environment variables.');
} else {
  // console.log('SECRET_KEY loaded successfully.');
}

export const encryptData = (data) => {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (encryptedData) => {
  if (!encryptedData) return '';
  try {
    // Optional: Check if data is likely encrypted
    if (!encryptedData.startsWith('U2FsdGVkX1')) { 
      // Data is not encrypted
      return encryptedData;
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption resulted in empty string');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Return original data if decryption fails
  }
};
