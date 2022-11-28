const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SK);


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.selxuid.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const categoriesCollection = client.db('furnix').collection('categories');
        const productsCollection = client.db('furnix').collection('products');
        const bookingsCollection = client.db('furnix').collection('bookings');
        const usersCollection = client.db('furnix').collection('users');
        const paymentsCollection = client.db('furnix').collection('payments');

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        }

        app.get('/categories', async (req, res) => {
            const query = {}
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = {}
            const products = await productsCollection.find(query).toArray();
            const products_Collection = products.filter(product => product.category_id === id);
            res.send(products_Collection);
        });

        app.get('/categoriesNewProduct', async (req, res) => {
            const query = {}
            const result = await categoriesCollection.find(query).project({ id: 1 }).toArray();
            res.send(result);
        });

        app.get('/products', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
            const query = { email: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        app.post('/products', verifyJWT, verifyAdmin, async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        });

        app.delete('/products/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await bookingsCollection.findOne(query);
            res.send(order);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
            const query = { email: email };
            const orders = await bookingsCollection.find(query).toArray();
            res.send(orders);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.post('/create-payment-intent', async(req, res)=>{
            const order = req.body;
            const price = order.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async(req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.orderId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: 'Forbidden Access' })
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });


        // =============================
        // user admin
        // =============================

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });

        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        // app.get('/edited', async(req, res)=>{
        //     const filter = {}
        //     const options = {upsert: true};
        //     const updatedDoc = {
        //         $set: {
        //             rating: 4.5,
        //             location: Bogura,
        //             published_date: 12-03-2021
        //         }
        //     }
        //     const result = await productsCollection.updateMany(filter, updatedDoc,options);
        //     res.send(result);
        // });

    }
    finally {

    }
}

run().catch(error => console.error(error));



app.get('/', async (req, res) => {
    res.send('Dream furniture API is Running');
});



app.listen(port, () => {
    console.log(`Dream Furniture Server running on ${port}`);
})