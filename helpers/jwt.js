const jwt = require('jsonwebtoken');



const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JTW_SECREET);
}

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JTW_SECREET);
}

module.exports = {
    generateToken,
    verifyToken
}