const jwt = require('jsonwebtoken');



const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECREET);
}

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECREET);
}

module.exports = {
    generateToken,
    verifyToken
}