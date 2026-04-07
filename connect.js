const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  let cleaned = uri.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

async function connectToMongoDB(url) {
  const normalizedUrl = normalizeMongoUri(url);
  if (!normalizedUrl) {
    throw new Error('MongoDB connection URI is required. Set MONGO_URI, MONGODB_URI, or DATABASE_URL.');
  }
  return mongoose.connect(normalizedUrl);
}

module.exports = {
  connectToMongoDB,
  normalizeMongoUri,
};