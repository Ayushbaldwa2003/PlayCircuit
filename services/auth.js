const jwt=require('jsonwebtoken')
const secretKey = process.env.JWT_SECRET || "Ayush@1212"

function setUser(user){  
    return jwt.sign({
        id:user._id,
        email:user.email
    },secretKey)
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