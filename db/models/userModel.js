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
            if (!user.name) return res.status(400).json({ message: 'name is required' })

            if (!user.email) return res.status(400).json({ message: 'email is required' })

            if (!user.password) return res.status(400).json({ message: 'password is required' })

            if (user.password.length < 6) return res.status(400).json({ message: 'password must be at least 6 characters' })

            const checkUser = await getCollection('users').findOne({ email: user.email })
            if (checkUser) return res.status(400).json({ message: 'account already registered' });

            const result = await getCollection('users').insertOne({
                ...user,
                address: {
                    street: "",
                    village: "",
                    distric: "",
                    city: ""
                },
                phone: '',
                password: hashPass(user.password),
                createdAt: new Date(),
                updatedAt: new Date()
            })

            return res.json({
                message: 'success register',
                _id: result.insertedId,
                ...user,
                createdAt: new Date(),
                updatedAt: new Date()

            })
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }


    //TODO LOGIN
    static async loginUser(req, res) {
        try {
            const { email, password } = req.body
            if (!email) return res.status(400).json({ message: 'email is required' })
            if (!password) return res.status(400).json({ message: 'password is required' })


            const user = await getCollection('users').findOne({ email })
            if (!user) return res.status(400).json({ message: 'account not found' })

            const checkPass = comparePass(password, user.password)
            if (!checkPass) return res.status(400).json({ message: 'password not valid' })

            const token = generateToken({
                _id: user._id,
                email: user.email
            })

            return res.json({
                message: 'success login',
                access_token: token
            })

        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    //TODO GET USER CUSTOMER

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
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }



    //TODO GET USER PROVIDER
    static async getUserById(req, res) {
        try {
            const user = await getCollection('users').aggregate(
                [
                    {
                        '$match': {
                            '_id': new ObjectId(req.user._id)
                        }
                    }, {
                        '$lookup': {
                            'from': 'outlets',
                            'localField': '_id',
                            'foreignField': 'userId',
                            'as': 'outlets'
                        }
                    },
                    {
                        $lookup:
                        {
                            from: "transactions",
                            pipeline: [
                                {
                                    $match: {
                                        paymentStatus: "Completed",
                                    }
                                },
                            ],
                            localField: "_id",
                            foreignField: "userId",
                            as: "transactions",
                        }
                    }
                ]
            ).toArray()

            let saldoIn = await getCollection('transactions').aggregate([
                {
                    '$match': {
                        '$and': [
                            {
                                'userId': new ObjectId(req.user._id)
                            }, {
                                'description': 'IN'
                            }, {
                                'paymentStatus': 'Completed'
                            }
                        ]
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'sum': {
                            '$sum': '$amount'
                        }
                    }
                }
            ]).toArray()

            let saldoOut = await getCollection('transactions').aggregate([
                {
                    '$match': {
                        '$and': [
                            {
                                'userId': new ObjectId(req.user._id)
                            }, {
                                'description': 'OUT'
                            }, {
                                'paymentStatus': 'Completed'
                            }
                        ]
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'sum': {
                            '$sum': '$amount'
                        }
                    }
                }
            ]).toArray()

            let saldo = 0

            saldoIn.length != 0 ? saldo = saldoIn[0]?.sum : saldo = 0
            saldoOut.length != 0 ? saldo = saldo - saldoOut[0]?.sum : saldo = saldo

            await res.json({
                ...user[0],
                saldo
            })
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }
}

module.exports = UserModel