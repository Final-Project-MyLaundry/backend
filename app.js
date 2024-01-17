if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const UserModel = require('./db/models/userModel')
const OutletModel = require('./db/models/outletModel')
const app = express()
const port = 3000

app.get('/user', UserModel.getUsers)

app.get('/outlet', OutletModel.getOutlets)
app.post('/outlet', OutletModel.addOutlet)
app.put('/outlet', OutletModel.editOutlet)
app.delete('/outlet', OutletModel.deleteOutlet)








app.listen(port, () => {
  console.log(`Gacor bwang ${port}`)
})