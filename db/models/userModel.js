const { ObjectId } = require("mongodb");
const { hashPass, comparePass } = require("../../helpers/bcrypt");
const { generateToken } = require("../../helpers/jwt");
const { getCollection } = require("../config/configMongo");

class UserModel {

    static collection() {
        return getCollection('users')
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
                address: {
                    street: "",
                    village: "",
                    distric: "",
                    city: ""
                },
                phone: '',
                balance: 0,
                password: hashPass(user.password)
            })

            await res.json({
                message: 'success register',
                _id: result.insertedId,
                ...user,
                createdAt: new Date(),
                updatedAt: new Date()

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
                email: user.email
            })

            await res.json({
                message: 'success login',
                access_token: token
            })

        } catch (error) {
            res.json({ message: error.message })
        }
    }

    //TODO GET USER BY ID
    static async getUserById(req, res) {
        try {
            // const { id } = req.params
            const user = await getCollection('users').aggregate(
                [
                    {
                      '$match': {
                        '_id': new ObjectId(req.user._id)
                      }
                    }, {
                      '$lookup': {
                        'from': 'transactions', 
                        'localField': '_id', 
                        'foreignField': 'userId', 
                        'as': 'transactions'
                      }
                    }
                  ]
            ).toArray()
            await res.json(user)
        } catch (error) {
            res.json({ message: error.message })
        }
    }
    //TODO UPDATE PROFILE
    static async updateUser(req, res) {
        try {
            if (!req.body.name) throw Error('name is required')

            if (!req.body.email) throw Error('email is required')

            if (!req.body.address.street) throw Error('street is required')

            if (!req.body.address.village) throw Error('village is required')

            if (!req.body.address.distric) throw Error('distric is required')

            if (!req.body.address.city) throw Error('city is required')

            if (!req.body.phone) throw Error('phone is required')

            await getCollection('users').updateOne({ _id: req.user._id }, {
                $set: {
                    ...req.body,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })

            await res.json({
                ...req.body
            })

        } catch (error) {
            res.json({ message: error.message })
        }
    }
}

module.exports = UserModel