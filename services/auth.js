const jwt = require('jsonwebtoken');

function normalizeSecret(secret) {
  if (!secret || typeof secret !== 'string') return '';
  let normalized = secret.trim();
  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

const secretKey = normalizeSecret(process.env.JWT_SECRET) || "Ayush@1212";

function setUser(user) {
  return jwt.sign({
    id: user._id,
    email: user.email,
  }, secretKey);
}

function getUser(token){
    if(!token){
        return null
    }
    try{
        return jwt.verify(token,secretKey)
    }
    catch(err){
        return null
    }
} 
module.exports={
    setUser,
    getUser
}