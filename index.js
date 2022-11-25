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
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});


const categories = require('./Data/categories.json');
const products = require('./Data/products.json');

app.get('/', (req, res) => {
    res.send('Dream furniture API Running');
});

app.get('/products-categories', (req, res) =>{
    res.send(categories)
});

app.get('/category/:id', (req, res) =>{
    const id = req.params.id;
    const category_products = products.filter(product => product.category_id === id);
    res.send(category_products);
})

app.get('/products/:id', (req, res)=>{
    const id = req.params.id;
    const selectedProducts = products.find(product => product._id === id);
    res.send(selectedProducts);
})

app.listen(port, () => {
    console.log(`Dream Furniture Server running on ${port}`);
})