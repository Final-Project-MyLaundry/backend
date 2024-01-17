const { hashPass } = require("../../helpers/bcrypt");
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
}

module.exports = UserModel