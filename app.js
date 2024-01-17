if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const UserModel = require('./db/models/userModel')
const app = express()
const port = 3000

app.use(express.json()) 
app.use(express.urlencoded({ extended: true })) 

app.get('/users', UserModel.getUsers)
app.post('/users/register', UserModel.registerUser)


app.get('/outlet', UserModel.getUsers)










app.listen(port, () => {
  console.log(`Gacor bwang ${port}`)
})