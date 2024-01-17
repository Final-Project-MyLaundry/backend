const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/configMongo");

module.exports = class OutletModel {

  static async getOutlets(req, res) {
    const outlets = await getCollection('outlets').find().toArray();
    await res.json(outlets)
  }
  static async addOutlet(req, res) {
    const data = req.body
    data = {
      ...data,
      userId : new ObjectId(req.user._id)
    }
    const addOutlet = await getCollection('outlets').insertOne(data)
    await res.json(addOutlet)

    //foto dipisah?
  }
  static async editOutlet(req, res) {
    const data = req.body
    const editOutlet = await getCollection('outlets').replaceOne({_id : new ObjectId(data._id)},data)
    await res.json(editOutlet)
  }
  static async deleteOutlet(req, res) {
    const data = req.body
    const deleteOutlet = await getCollection('outlets').deleteOne({_id: new ObjectId(data)})
    await res.json(deleteOutlet)
  }

}
