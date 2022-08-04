const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs')
const app = express();

//creates and logs all access to the page on log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}));

//prints error on terminal 
app.use((err, req, res, next) => {
    console.error(err.stack);
})

app.get('/movies', (req, res) => {
    res.json(topMovies);
})
app.get('/', (req, res) => {
    res.send('Welcome to movieAPI');
})
app.use(express.static('public'));

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});