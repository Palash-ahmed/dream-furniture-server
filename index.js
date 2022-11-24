const express = require('express')
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());

const categories = require('./Data/categories.json');

app.get('/', (req, res) => {
    res.send('Dream furniture API Running');
});

app.get('/products-categories', (req, res) =>{
    res.send(categories)
})

app.listen(port, () => {
    console.log('Dream Furniture Server running on port', port)
})