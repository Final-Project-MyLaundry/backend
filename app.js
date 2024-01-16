if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const UserModel = require('./db/models/userModel')
const app = express()
const port = 3000

app.get('/user', UserModel.getUsers)

app.listen(port, () => {
  console.log(`Gacor bwang ${port}`)
})