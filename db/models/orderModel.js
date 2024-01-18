const { ObjectId } = require("mongodb");

module.exports = class OrderModel {
    static async postOrder(req, res) {
        try {
            const data = req.body

            if (!data.services?.length == 0) throw Error('services is required')

            inpServices = data.services.map(el => {
                return {
                    servicesId: new ObjectId(el),
                    qty : 0,
                }
            })

            let input = {
                ...data,
                userId: new ObjectId(req.user._id),
                outletId: new ObjectId(req.params.id),
                services : [
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

            const data = await getCollection('orders').find({ userId: new ObjectId(req.user.id) }).toArray()

            await res.json(data)

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
