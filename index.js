const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.selxuid.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.send(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];
}

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

        app.get('/bookings', verifyJWT, async(req, res)=>{
            const email = req.query.email;
            const query = {email: email};
            const orders = await bookingsCollection.find(query).toArray();
            res.send(orders);
        });

        app.post('/bookings', async(req, res)=>{
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.get('/jwt', async(req, res)=>{
            const email = req.query.email;
            const query = {email: email};
            const user =await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''})
        })

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