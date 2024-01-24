const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/configMongo");
const midtransClient = require('midtrans-client')

module.exports = class OrderModel {
    static async postOrder(req, res) { //customer
        try {
            const { isChecked, notes } = req.body //notes, services
            let inpServices = []

            let outlet = await getCollection('outlets').findOne({ _id: new ObjectId(req.params.id) })
            for (const key in isChecked) {
                inpServices.push({
                    servicesId: new ObjectId(key),
                    qty: 0
                })
            }
            let input = {
                notes,
                customerId: new ObjectId(req.user._id),
                providerId: new ObjectId(outlet.userId),
                outletId: new ObjectId(req.params.id),
                servicesId: [
                    ...inpServices,
                ],
                progress: 'Waiting',
                statusReceive: false,
                statusPay: 'unpaid',
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const addOrder = await getCollection('orders').insertOne(input)
            await res.json(addOrder)

        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async patchOrderProgress(req, res) {
        try {
            const { progress } = req.body
            let patch = await getCollection('orders').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { progress } })

            patch.acknowledged && res
                .json({ message: 'success patch progress' })
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async patchOrderServices(req, res) {
        try {
            const data = req.body

            let order = await getCollection('orders').findOne({ _id: new ObjectId(req.params.id) })
            let services = order.servicesId.map((el, i) => {
                return (
                    {
                        servicesId: el.servicesId,
                        qty: data[i]
                    }
                )
            })
            order = {
                ...order,
                servicesId: services
            }

            delete order._id

            let patch = await getCollection('orders').replaceOne({ _id: new ObjectId(req.params.id) }, order)

            patch.acknowledged && res
                .json({ message: 'success patch progress' })
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async patchOrderReceive(req, res) {
        try {
            const patchOrder = await getCollection('orders').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { statusReceive: true } })

            const data = (await getCollection('orders').aggregate(
                [
                    {
                        '$match': {
                            '_id': new ObjectId(req.params.id)
                        }
                    }, {
                        '$lookup': {
                            'from': 'services',
                            'localField': 'servicesId.servicesId',
                            'foreignField': '_id',
                            'as': 'result'
                        }
                    }, {
                        '$sort': {
                            'createdAt': 1
                        }
                    }
                ]
            ).toArray())[0]

            let totalAmount = 0
            for (let i = 0; i < data.servicesId.length; i++) {
                totalAmount += (data.result[i].price * data.servicesId[i].qty)
            }

            if (patchOrder.acknowledged) {
                let postTransaction = await getCollection('orders').insertOne({
                    userId: order.providerId,
                    description: "order",
                    amount: totalAmount,
                    paymentType: 'in',
                    paymentStatus: 'complete',
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
            }

            res
                .json({ message: 'success patch status receive' })

        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async getByUserCustomerOrder(req, res) {
        try {
            // await res.json('hehehe')

            const result = await getCollection('orders').aggregate(
                [
                    {
                        '$match': {
                            'customerId': new ObjectId(req.user._id)
                        }
                    }, {
                        '$lookup': {
                            'from': 'services',
                            'localField': 'servicesId.servicesId',
                            'foreignField': '_id',
                            'as': 'result'
                        }
                    }, {
                        '$sort': {
                            'result._id': 1
                        }
                    }, {
                        '$sort': {
                            'servicesId.servicesId': 1
                        }
                    }, {
                        '$sort': {
                            'createdAt': -1
                        }
                    }
                ]
            ).toArray()

            // let data = result.map(el => {
            //     let totalAmount = 0
            //     for (let i = 0; i < el.servicesId.length; i++) {
            //         totalAmount += (el.result[i].price * el.servicesId[i].qty)
            //     }
            //     return {
            //         ...el,
            //         totalAmount
            //     }
            // })
            let data = result.map(el => {
                let totalAmount = 0;
    
                // Menghitung totalAmount untuk setiap layanan dalam order
                el.servicesId.forEach(service => {
                    const matchedService = el.result.find(resultService => resultService._id.equals(service.servicesId));
                    if (matchedService) {
                        totalAmount += (matchedService.price * service.qty);
                    }
                });
    
                // Menambahkan totalAmount ke dalam objek order
                return {
                    ...el,
                    totalAmount
                };
            });
            // console.log(data);
            res.json(data)

        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async getByUserProviderOrder(req, res) {
        try {
            const { param } = req.params
            if (param == 'Waiting') {
                const data = await getCollection('orders').aggregate(
                    [
                        {
                            '$match': {
                                '$and': [
                                    {
                                        'providerId': new ObjectId(req.user._id)
                                    }, {
                                        'progress': 'Waiting'
                                    }
                                ]
                            }
                        }, {
                            '$lookup': {
                                'from': 'outlets',
                                'localField': 'outletId',
                                'foreignField': '_id',
                                'as': 'outlet'
                            }
                        }, {
                            '$unwind': {
                                'path': '$outlet'
                            }
                        }, {
                            '$set': {
                                'outlet': '$outlet.name'
                            }
                        }, {
                            '$sort': {
                                'createdAt': 1
                            }
                        }
                    ]
                ).toArray()
                res.json(data)
            }
            else if (param == 'outlet') {
                const data = await getCollection('orders').aggregate(
                    [
                        {
                            '$match': {
                                'providerId': new ObjectId(req.user._id)
                            }
                        }, {
                            '$lookup': {
                                'from': 'outlets',
                                'localField': 'outletId',
                                'foreignField': '_id',
                                'as': 'outlet'
                            }
                        }, {
                            '$unwind': {
                                'path': '$outlet'
                            }
                        }, {
                            '$set': {
                                'outlet': '$outlet.name'
                            }
                        }, {
                            '$sort': {
                                'createdAt': 1
                            }
                        }
                    ]
                ).toArray()
                res.json(data)
            }
            else {
                const data = await getCollection('orders').find({ providerId: new ObjectId(req.user.id) }).toArray()
                res.json(data)
            }

        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async getByIdOrder(req, res) {
        try {
            const data = (await getCollection('orders').aggregate(
                [
                    {
                        '$match': {
                            '_id': new ObjectId(req.params.id)
                        }
                    }, {
                        '$lookup': {
                            'from': 'services',
                            'localField': 'servicesId.servicesId',
                            'foreignField': '_id',
                            'as': 'result'
                        }
                    }, {
                        '$sort': {
                            'result._id': 1
                        }
                    }, {
                        '$sort': {
                            'servicesId.servicesId': 1
                        }
                    }
                ]
            ).toArray())[0]

            const calculateTotalPrice = (qty, price) => qty * price;

            let totalPrice = 0
            const resultWithTotalPrice = data.result.map(service => {

                totalPrice +=  calculateTotalPrice(
                    data.servicesId.find(s => s.servicesId.equals(service._id)).qty,
                    service.price
                    )
                    
                    return {
                        qty: data.servicesId.find(s => s.servicesId.equals(service._id)).qty,
                        name : service.name
                    }
              });
              


            await res.json({
                ...data,
                totalAmount: totalPrice,
                servicesId: resultWithTotalPrice
            })

        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async createPayment(req, res) {
        try {
            let snap = new midtransClient.Snap({
                isProduction: false,
                serverKey: `SB-Mid-server-wPAyf2fRg0fN1RsrbGtWWDD2`
            })

            const orderId = `TRX-au-${Math.random().toString()}`
            const trxAmount = req.body.amount
            const transaction = await snap.createTransaction({
                "transaction_details": {
                    "order_id": orderId,
                    "gross_amount": trxAmount
                },
                "credit_card": {
                    "secure": true
                },
                "customer_details": {
                    "email": 'tes@mail.com'
                },
            })
            // console.log(transaction);

            await getCollection('transactions').insertOne({
                orderId,
                userId: req.user._id,
                description: 'IN',
                amount: +trxAmount,
                paymentType: 'topup',
                paymentStatus: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            })

            res.json({ url: transaction.redirect_url, orderId })
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async postPayment(req, res) {
        try {
            const { transaction_status, status_code, order_id } = req.body
            if (transaction_status == 'capture', status_code == 200) {
                await getCollection('transactions').updateOne({ orderId: order_id }, {
                    $set: {
                        paymentStatus: 'Completed',
                        updatedAt: new Date()
                    }
                })
            }
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }

    static async patchPayment(req, res) {
        const orderId = req.body.orderId
        try {
            const url = `https://api.sandbox.midtrans.com/v2/${orderId}/status`

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    authorization: "Basic " + "U0ItTWlkLXNlcnZlci13UEF5ZjJmUmcwZk4xUnNyYkd0V1dERDI6"
                }
            })

            if (res.transaction_status === 'capture' && res.status_code == 200) {
                await getCollection('transactions').updateOne(orderId, {
                    status: 'paid',
                    updatedAt: new Date()
                })

                res.json({ message: 'Transaction success' })
            } else {
                res.status(400).json({ message: 'Transaction is not success' })
            }
        } catch (error) {
            console.error('Error:', error);
            res.json({ message: error.message })
        }
    }
}
