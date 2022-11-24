const express = require('express')
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Dream furniture API Running');
});

app.listen(port, () => {
    console.log('Dream Furniture Server running on port', port)
})