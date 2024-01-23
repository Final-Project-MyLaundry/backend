const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/configMongo");

class ServiceModel {

    static collection() {
        return getCollection('users')
    }

    //TODO REGISTER
    static async getServices(req, res) {
        try {
            const services = await getCollection('listServices').find().toArray()

            res.json(services)
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async postServices(req, res) {
        try {
            let data = req.body
            data = {
                ...data,
                outletId: new ObjectId(data.outletId),
                createdAt: new Date(),
                updatedAt: new Date()
            }
            const services = await getCollection('services').insertOne(data)

            res.json(services)
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }


}

module.exports = ServiceModel