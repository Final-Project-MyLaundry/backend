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
const storage = multer.memoryStorage()
const upload = multer({storage})

app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 

app.get('/users', UserModel.getUsers)
app.post('/users/register', UserModel.registerUser)
app.post('/users/login', UserModel.loginUser)
app.get('/users/:id', UserModel.getUserById)
app.put('/users/:id',authentication, UserModel.updateUser)


app.use(authentication)

app.get('/outlets', authentication, OutletModel.getOutlets)

app.get('/outlets/user', OutletModel.getByUserIdOutlets)

app.get('/outlets/:id', OutletModel.getByIdOutlets)

app.post('/outlets', OutletModel.addOutlet)

app.put('/outlets', OutletModel.editOutlet)

app.patch('/outlets',upload.single('image'), OutletModel.patchOutlet)

app.delete('/outlets', OutletModel.deleteOutlet)









app.listen(port, () => {
  console.log(`Gacor bwang ${port}`)
})