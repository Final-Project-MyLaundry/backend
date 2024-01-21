const { ObjectId } = require("mongodb");

module.exports = class OrderModel {
    static async postOrder(req, res) { //customer
        try {
            const data = req.body //notes, services

            if (!data.services?.length == 0) throw Error('services is required')

            inpServices = data.services.map(el => {
                return {
                    servicesId: new ObjectId(el),
                    qty: 0,
                }
            })

            let input = {
                ...data,
                userId: new ObjectId(req.user._id),
                outletId: new ObjectId(req.params.id),
                services: [
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

    static async patchOrderProgress(req, res) {
        try {

            const data = req.body
            let patch = await getCollection('orders').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { progress: data } })

            patch.acknowledged && res
                .json({ message: 'success patch progress' })
        } catch (error) {
            res.json({ message: error.message })
        }
    }

    static async patchOrderReceive(req, res) {
        try {
            const order = await getCollection('orders').findOne({ _id: new ObjectId(req.params.id) })

            const patchOrder = await getCollection('orders').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { statusReceive: true } })
            
            if(patchOrder.acknowledged){
                let postTransaction = await getCollection('orders').insertOne({
                    userId: order.providerId,
                    description: "order",
                    amount: 0
                })
            }



         
            res
                .json({ message: 'success patch status receive' })

        } catch (error) {
            res.json({ message: error.message })
        }
    }

    static async getByUserCustomerOrder(req, res) {
        try {

            const data = await getCollection('orders').find({ customerId: new ObjectId(req.user.id) }).toArray()

            res.json(data)

        } catch (error) {
            res.json({ message: error.message })
        }
    }

    static async getByUserProviderOrder(req, res) {
        try {

            const data = await getCollection('orders').find({ providerId: new ObjectId(req.user.id) }).toArray()

            res.json(data)

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
