const { ObjectId } = require('mongodb');
const { getCollection } = require('../db/config/configMongo');
const { getUserById } = require('../db/models/userModel');
const { verifyToken } = require('../helpers/jwt');

async function authentication(req, res, next){
   try {
    // console.log("masuk authen");
    let token = req.headers.authorization
    // console.log(token);

    if (!token) throw Error('Invalid Token');

    if(token.slice(0, 7) !== 'Bearer ') throw {name : "InvalidToken"};

    token = token.slice(7)

    const payload = verifyToken(token)
    // console.log(payload);

    const user = await getCollection('users').findOne({ _id : new ObjectId(payload._id) })
    // console.log(user, 'ini dari user authe');

    if (!user) throw Error('Invalid Token');
    
    req.user = {
        _id : user._id,
        email : user.email,
    }
    next()
   } catch (error) {
     res.json({message : error.message})
   }
}

module.exports = {authentication}