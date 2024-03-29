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
      const { filter, nearby } = req.body
      // console.log(req.body);
      // console.log(filter,nearby);
      let query = {
        statusOpen: true
      }
      let agg = [
        {
          '$match': {
            'statusOpen': true
          }
        },
        {
          '$lookup': {
            'from': 'services',
            'localField': '_id',
            'foreignField': 'outletId',
            'as': 'services'
          }
        }
      ]

      if (filter != "All") {
        agg.push({
          '$match': {
            'services.name': new RegExp(filter, 'i')
          }
        })
      }

      if (nearby) {
        agg.push({
          '$match': {
            'address.village': new RegExp(nearby, 'i')
          }
        })
      }

      const outlets = await getCollection('outlets').aggregate(agg).toArray();
      await res.json(outlets)

    } catch (error) {
      // console.log(error);
      console.error('Error:', error);
      res.json({ message: error.message })

    }
  }

  static async getByUserIdOutlets(req, res) {
    try {
      const outlets = await getCollection('outlets').find({ userId: new ObjectId(req.user._id) }).toArray();

      res.json(outlets)

    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })

    }
  }

  static async getByIdOutlets(req, res) {
    try {
      let { id } = req.params
      const outlets = await getCollection('outlets').aggregate(
        [
          {
            '$match': {
              '_id': new ObjectId(id)
            }
          }, {
            '$lookup': {
              'from': 'services',
              'localField': '_id',
              'foreignField': 'outletId',
              'as': 'services'
            },
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'reviews.userId',
              'foreignField': '_id',
              'as': 'result'
            }
          }, {
            '$set': {
              'reviews.name': '$result.name'
            }
          }
        ]
      ).toArray();

      const reviews = await getCollection('outlets').aggregate(
        [
          {
            '$match': {
              '_id': new ObjectId(id)
            }
          }, {
            '$unwind': {
              'path': '$reviews'
            }
          }, {
            '$lookup': {
              'from': 'users', 
              'localField': 'reviews.userId', 
              'foreignField': '_id', 
              'as': 'result'
            }
          }, {
            '$set': {
              'reviews.name': '$result.name'
            }
          }, {
            '$group': {
              '_id': '$_id', 
              'reviews': {
                '$push': '$reviews'
              }
            }
          }
        ]
      ).toArray()
      outlets[0] = { ...outlets[0], ...reviews[0] }

      res.json(outlets)
    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })

    }
  }

  static async addOutlet(req, res) {
    try {
      const data = req.body

      if (!data.name) throw Error('name is required')
      if (!data.address?.street || !data.address?.village || !data.address?.district || !data.address?.city) throw Error('address is not complete')
      if (!data.phone) throw Error('phone number is required')

      let input = {
        ...data,
        userId: new ObjectId(req.user._id),
        image: 'https://i.pinimg.com/474x/bf/08/e3/bf08e3b80f893f99d423b7546ba6c24a.jpg',
        reviews: [],
        statusOpen: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const addOutlet = await getCollection('outlets').insertOne(input)
      res.json({
        _id: addOutlet.insertedId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })
    }
    //foto dipisah?
  }

  static async getServices(req, res) {
    try {
      const services = await getCollection('listServices').find().toArray()
      await res.json(services)
    } catch (error) {
      res.json({ message: error.message })
    }
  }

  static async editOutlet(req, res) {
    try {
      const data = req.body
      const outletBefore = await getCollection('outlets').findOne({ _id: new ObjectId(req.params.id) })
      const editOutlet = await getCollection('outlets').replaceOne({ _id: new ObjectId(req.params.id) }, {
        ...outletBefore,
        ...data
      })
      res.json(editOutlet)
    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })
    }
  }

  static async patchOutletReview(req, res) {
    try {

      const data = req.body
      let patch = await getCollection('outlets').updateOne({ _id: new ObjectId(req.params.id) }, { $push: { reviews: data } })

      patch.acknowledged && res
        .json({ message: 'success add review' })
    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })
    }
  }

  static async patchOutletImage(req, res) {
    try {
      if (!req.file) {
        throw Error("Please enter an image")
      }
      const base64 = Buffer.from(req.file.buffer).toString('base64')
      const dataURI = `data:${req.file.mimetype};base64,${base64}`

      const result = await cloudinary.uploader.upload(dataURI)

      let patch = await getCollection('outlets').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { image: result.secure_url } })

      patch.acknowledged && res
        .json({ message: 'success patch image' })
    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })
    }
  }

  static async patchOpen(req, res) {
    try {

      const patchOpen = await getCollection('outlets').updateOne({ _id: new ObjectId(req.params.id) }, [{ $set: { statusOpen: { $eq: [false, "$statusOpen"] } } }])
      res.json(patchOpen)
    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })
    }
  }

  static async deleteOutlet(req, res) {
    try {
      const deleteOutlet = await getCollection('outlets').deleteOne({ _id: new ObjectId(req.params.id) })
      await res.json(deleteOutlet)
    } catch (error) {
      res.json({ message: error.message })
    }
  }

  static async getByIdOutletsProvider(req, res) {
    try {
      let { id } = req.params
      const outlets = await getCollection('outlets').aggregate(
        [
          {
            '$match': {
              '_id': new ObjectId(id)
            }
          }, {
            '$lookup': {
              'from': 'orders',
              'localField': '_id',
              'foreignField': 'outletId',
              'as': 'historyOrders'
            }
          },{
            '$lookup': {
              'from': 'services',
              'localField': '_id',
              'foreignField': 'outletId',
              'as': 'services'
            }
          }
        ]
      ).toArray();

      const reviews = await getCollection('outlets').aggregate(
        [
          {
            '$match': {
              '_id': new ObjectId(id)
            }
          }, {
            '$unwind': {
              'path': '$reviews'
            }
          }, {
            '$lookup': {
              'from': 'users', 
              'localField': 'reviews.userId', 
              'foreignField': '_id', 
              'as': 'result'
            }
          }, {
            '$set': {
              'reviews.name': '$result.name'
            }
          }, {
            '$group': {
              '_id': '$_id', 
              'reviews': {
                '$push': '$reviews'
              }
            }
          }
        ]
      ).toArray()
      outlets[0] = { ...outlets[0], ...reviews[0] }
      await res.json(outlets)

    } catch (error) {
      console.error('Error:', error);
      res.json({ message: error.message })

    }
  }

}