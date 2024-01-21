if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const UserModel = require('./db/models/userModel')
const { authentication } = require('./middlewares/authentication')
const OutletModel = require('./db/models/outletModel')
const app = express()
const port = 3000

const multer  = require('multer')
const OrderModel = require('./db/models/orderModel')
const storage = multer.memoryStorage()
const upload = multer({storage})

app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 

app.post('/users/register', UserModel.registerUser)
app.post('/users/login', UserModel.loginUser)

app.use(authentication)

//? USER PENGGUNA
app.get('/users', UserModel.getUserById) //TODO GET PROFILE USER CUSTOMER
app.get('/users/provider', UserModel.getUserByIdProvider) //TODO GET PROFILE USER PROVIDER
app.put('/users', UserModel.updateUser)


//? OUTLET
app.get('/outlets', OutletModel.getOutlets) //TODO GET ALL OUTLET
app.get('/outlets/provider', OutletModel.getByUserIdOutlets) //TODO GET OUTLET BY USER PROVIDER
app.get('/outlets/:id', OutletModel.getByIdOutlets) //TODO GET OUTLET BY ID FOR CUSTOMER
app.get('/outlets/provider/:id', OutletModel.getByIdOutletsProvider) //TODO GET OUTLET BY ID FOR PROVIDER
app.post('/outlets', OutletModel.addOutlet)
app.put('/outlets', OutletModel.editOutlet)
app.patch('/outlets',upload.single('image'), OutletModel.patchOutlet)
app.delete('/outlets', OutletModel.deleteOutlet)




app.get('/orders', OrderModel.getByUserOrder)

app.get('/orders/:id', OrderModel.getByIdOrder)

app.post('/orders/:id', OrderModel.postOrder)

app.patch('/orders/:id', OrderModel.postOrder)











app.listen(port, () => {
  console.log(`Gacor bwang ${port}`)
})