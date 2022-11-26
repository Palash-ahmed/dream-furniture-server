const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.selxuid.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoriesCollection = client.db('furnix').collection('categories');
        const productsCollection = client.db('furnix').collection('products');
        const bookingsCollection = client.db('furnix').collection('bookings');
        const usersCollection = client.db('furnix').collection('users');

        app.get('/categories', async(req, res)=>{
            const query = {}
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/categories/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {}
            const products = await productsCollection.find(query).toArray();
            const products_Collection = products.filter(product => product.category_id === id);
            res.send(products_Collection);
        });  

        app.get('/bookings', async(req, res)=>{
            const email = req.query.email;
            const query = {buyerEmail: email};
            const orders = await bookingsCollection.find(query).toArray();
            res.send(orders);
        });

        app.post('/bookings', async(req, res)=>{
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.post('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

    }
    finally{

    }
}

run().catch(error => console.error(error));



app.get('/', async(req, res) => {
    res.send('Dream furniture API is Running');
});



app.listen(port, () => {
    console.log(`Dream Furniture Server running on ${port}`);
})