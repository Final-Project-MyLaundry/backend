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
            res.json({ message: error.message })
        }
    }


}

module.exports = ServiceModel