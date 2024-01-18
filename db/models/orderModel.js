const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/configMongo");

module.exports = class OrderModel {
    static async postOrder(req, res) {
        try {
            const data = req.body

            if (data.servicesId?.length == 0) throw Error('services is required')

            let inpServices = data.servicesId.map(el => {
                return {
                    servicesId: new ObjectId(el),
                    qty : 0,
                }
            })

            let input = {
                ...data,
                userId: new ObjectId(req.user._id),
                outletId: new ObjectId(req.params.id),
                servicesId : [
                    ...inpServices,
                ],
                progress: 'waiting',
                statusReceive: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const addOrder = await getCollection('orders').insertOne(input)
            await res.json(addOrder)

        } catch (error) {
            res.json({ message: error.message })
        }
    }

    static async patchOrder(req, res) {
        try {

            const patchOrder = await getCollection('orders').updateOne({ _id: req.params.id }, { $set: { statusReceive: true } })
            await res.json(patchOrder)

        } catch (error) {
            res.json({ message: error.message })
        }
    }

    static async getByUserOrder(req, res) {
        try {
            // console.log(req.user._id)

            const data = (await getCollection('orders').aggregate(
                [
                    {
                        '$match': {
                        'userId': new ObjectId(req.user._id)
                      }
                    }, {
                      '$lookup': {
                        'from': 'services', 
                        'localField': 'servicesId.servicesId', 
                        'foreignField': '_id', 
                        'as': 'result'
                      }
                    }
                  ]
            ).toArray())[0]

            console.log(data);

            let totalAmount = 0
            let services = []
            for (let i = 0; i < data.servicesId.length; i++) {
                totalAmount += (data.result[i].price * data.servicesId[i].qty)
                services.push({
                    name : data.result[i].name,
                    qty : data.servicesId[i].qty
                })
            }

            await res.json({
                ...data,
                totalAmount,
                servicesId: services
            })

        } catch (error) {
            res.json({ message: error.message })
        }
    }

    static async getByIdOrder(req, res) {
        try {
            const data = await getCollection('orders').find({ _id: new ObjectId(req.params.id) }).toArray()

            await res.json(data)

        } catch (error) {
            res.json({ message: error.message })
        }
    }

}
