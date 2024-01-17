const { getCollection } = require("../config/configMongo");

class UserModel {

    static collection() {
        return getCollection('users')
    }


    static async getUsers(req, res) {
        const user = await getCollection('users').find().toArray();
        await res.json(user)
    }
}

module.exports = UserModel