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
      if (!data.address?.street || !data.address?.village || !data.address?.district || !data.address?.country) throw Error('address is not complete')
      if (!data.phone) throw Error('phone number is required')
      if (!data.services?.length == 0) throw Error('services is required')

      let input = {
        ...data,
        userId: new ObjectId(req.user._id),
        image: 'data:image/png;base64,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',
        reviews: [],
        statusOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const addOutlet = await getCollection('outlets').insertOne(input)
      await res.json(addOutlet)
      
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