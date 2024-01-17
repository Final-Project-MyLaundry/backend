const { hashPass, comparePass } = require("../../helpers/bcrypt");
const { generateToken } = require("../../helpers/jwt");
const { getCollection } = require("../config/configMongo");

class UserModel {

    static collection() {
        return getCollection('users')
    }

    static async getUsers(req, res) {
        const user = await getCollection('users').find().toArray();
        await res.json(user)
    }

    //TODO REGISTER
    static async registerUser(req, res) {

        try {
            const user = req.body
            // console.log(req.body)

            if (!user.name) throw Error('name is required')

            if (!user.email) throw Error('email is required')

            if (!user.password) throw Error('password is required')

            if (user.password.length < 6) throw Error('password must be at least 6 characters')

            const checkUser = await getCollection('users').findOne({ email: user.email })
            if (checkUser) throw Error('account already registered');

            const result = await getCollection('users').insertOne({
                ...user,
                password: hashPass(user.password)
            })

            await res.json({
                message: 'success register',
                _id: result.insertedId,
                ...user

            })
        } catch (error) {
            res.json({ message: error.message })
        }
    }

      
    //TODO LOGIN
    static async loginUser(req, res) {
        try {
            const { email, password } = req.body
            if (!email) throw Error('email is required')
            if (!password) throw Error('password is required')

            const user = await getCollection('users').findOne({ email })
            if (!user) throw Error('account not found')

            const checkPass = comparePass(password, user.password)
            if (!checkPass) throw Error('password not valid')

            const token = generateToken({
                _id: user._id,
                email : user.email
            })

            await res.json({
                message: 'success login',
                access_token: token
            })

        } catch (error) {
            res.json({ message: error.message })
        }
    }
}

module.exports = UserModel