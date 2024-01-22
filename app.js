if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const UserModel = require('./db/models/userModel')
const { authentication } = require('./middlewares/authentication')
const OutletModel = require('./db/models/outletModel')
const app = express()
const port = 3000
const cors = require('cors')

const multer  = require('multer')
const OrderModel = require('./db/models/orderModel')
const storage = multer.memoryStorage()
const upload = multer({storage})

app.use(express.json()) 
app.use(express.urlencoded({ extended: true }))
app.use(cors())

//TODO USER

app.post('/users/register', UserModel.registerUser)
app.post('/users/login', UserModel.loginUser)

app.use(authentication)

//? USER CUSTOMER PROVIDER
app.put('/users', UserModel.updateUser)

//? USER CUSTOMER
app.get('/users', UserModel.getUserById) //lookup transaction & order

//? USER PROVIDER
app.get('/users/provider', UserModel.getUserByIdProvider) //lookup transaction & outlet, ?order

//TODO OUTLET

//? USER CUSTOMER PROVIDER
app.get('/outlets/detail/:id', OutletModel.getByIdOutlets) //OUTLET BY ID ?services & review

//? USER CUSTOMER 
app.get('/outlets', OutletModel.getOutlets) //ALL OUTLET ?filter
app.patch('/outlets/reviews/:id',OutletModel.patchOutletReview)

//? USER PROVIDER
app.get('/outlets/provider', OutletModel.getByUserIdOutlets) //OUTLET BY USER PROVIDER
app.get('/outlets/provider/:id', OutletModel.getByIdOutletsProvider) //OUTLET BY ID
app.post('/outlets', OutletModel.addOutlet)
app.get('/outlets/services', OutletModel.getServices)
app.put('/outlets/:id', OutletModel.editOutlet)
app.patch('/outlets/:id',upload.single('image'), OutletModel.patchOutletImage)
app.delete('/outlets/:id', OutletModel.deleteOutlet)

//TODO ORDER

//? USER CUSTOMER PROVIDER
app.get('/orders/:id', OrderModel.getByIdOrder)

//? USER CUSTOMER
app.post('/orders/:id', OrderModel.postOrder)
app.get('/orders/customer/:param', OrderModel.getByUserCustomerOrder)
app.patch('/orders/statusReceive/:id',OrderModel.patchOrderReceive)

//? USER PROVIDER
app.get('/orders/provider/:param', OrderModel.getByUserProviderOrder)
app.patch('/orders/progress/:id',OrderModel.patchOrderProgress)

//TODO PAYMENT

app.post('/payment/midtrans/initiate', OrderModel.createPayment)
app.patch('/payment/midtrans/initiate', OrderModel.patchPayment)

















app.listen(port, () => {
  console.log(`Gacor bwang ${port}`)
})