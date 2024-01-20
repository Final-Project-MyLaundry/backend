const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/configMongo");
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

module.exports = class OutletModel {

  static async getOutlets(req, res) {
    try {
      const {filter, nearby} = req.body
      // console.log(req.body);

      let query = {
        statusOpen : true
      }
      if (nearby) {
        query = {
          ...query,
          location: {
            $near: {
              $maxDistance: 500,
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(nearby.longitude), parseFloat(nearby.latitude)]
              }
            }
          }
        }
      }
       
      if (filter) {
        query = { "services.name" : new RegExp(filter, 'i') }
      }

      const outlets = await getCollection('outlets').find(query).toArray();
      await res.json(outlets)
      
    } catch (error) {
      console.log(error);
      res.json({ message: error.message })
      
    }
  }

  static async getByUserIdOutlets(req, res) {
    try {
      const outlets = await getCollection('outlets').find({userId: new ObjectId(req.user._id)}).toArray();
      await res.json(outlets)
      
    } catch (error) {
      res.json({ message: error.message })
      
    }
  }

  static async getByIdOutlets(req, res) {
    try {
      let {id} = req.params
      const outlets = await getCollection('outlets').find({_id: new ObjectId(id)}).toArray();
      await res.json(outlets)
      
    } catch (error) {
      res.json({ message: error.message })
      
    }
  }

  static async addOutlet(req, res) {
    try {
      const data = req.body
      
      if (!data.name) throw Error('name is required')
      if (!data.address?.street || !data.address?.village || !data.address?.district || !data.address?.city) throw Error('address is not complete')
      if (!data.phone) throw Error('phone number is required')
      if (data.services.length == 0) throw Error('services is required')

      let input = {
        ...data,
        userId: new ObjectId(req.user._id),
        image: 'https://i.pinimg.com/474x/bf/08/e3/bf08e3b80f893f99d423b7546ba6c24a.jpg',
        reviews: [],
        statusOpen: false
      }

      const addOutlet = await getCollection('outlets').insertOne(input)
      await res.json({
        _id : addOutlet.insertedId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      
    } catch (error) {
      res.json({ message: error.message })
    }
    //foto dipisah?
  }

  static async editOutlet(req, res) {
    const editOutlet = await getCollection('outlets').replaceOne({ _id: new ObjectId(req.params.id) }, data)
    await res.json(editOutlet)
  }
  
  static async patchOutlet(req, res) {
    try {
      if (!req.file) {
        throw{name:"NotFound"}
      }
            const base64 = Buffer.from(req.file.buffer).toString('base64')
            const dataURI = `data:${req.file.mimetype};base64,${base64}`

            const result = await cloudinary.uploader.upload(dataURI)

            let patch = await getCollection('outlets').updateOne({_id: req.params.id}, { $set : {image: result.secure_url} })

            patch.acknowledged && res
                .json({message : 'success patch image'})
    } catch (error) {
        next(error)
    }
}

  static async deleteOutlet(req, res) {

  const deleteOutlet = await getCollection('outlets').deleteOne({ _id: new ObjectId(req.params.id) })
  await res.json(deleteOutlet)
}

}