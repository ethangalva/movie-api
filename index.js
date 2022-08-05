const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser')
const uuid = require('uuid')
const app = express();

app.use(bodyParser.json());

let users = [
    {
        id: 1,
        name: "Kim",
        favoriteMovies: []
    },
    {
        id: 2,
        name: "Joe",
        favoriteMovies: ["The Funder"]
    },
]
let movies = [
    {
        "title": "The Founder",
        "description": "The story of Ray Kroc, a salesman who turned two brothers' innovative fast food eatery, McDonald's, into the biggest restaurant business in the world, with a combination of ambition, persistence, and ruthlessness.",
        "genre": {
            "name": "Drama",
            "description": "The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters."
        },
        "directors": {
            "name": "John Lee Hancock",
            "bio": "John Lee Hancock was born on December 15, 1956 in Longview, Texas, USA. He is a writer and director, known for The Blind Side (2009), The Highwaymen (2019) and Saving Mr. Banks (2013).",
            "birth": 1956
        },
        "imageURL": "https://m.media-amazon.com/images/M/MV5BMzExNDg0MDk1M15BMl5BanBnXkFtZTgwNzE1Mjg0MDI@._V1_.jpg",
        "featured": false
    },
    {
        "title": "The Blind Side",
        "description": "The story of Michael Oher, a homeless and traumatized boy who became an All-American football player and first-round NFL draft pick with the help of a caring woman and her family.",
        "genre": {
            "name": "Drama",
            "description": "The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters."
        },
        "directors": {
            "name": "John Lee Hancock",
            "bio": "John Lee Hancock was born on December 15, 1956 in Longview, Texas, USA. He is a writer and director, known for The Blind Side (2009), The Highwaymen (2019) and Saving Mr. Banks (2013).",
            "birth": 1956
        },
        "imageURL": "https://m.media-amazon.com/images/M/MV5BMjEzOTE3ODM3OF5BMl5BanBnXkFtZTcwMzYyODI4Mg@@._V1_.jpg",
        "featured": false
    },
    {
        "title": "The Big Short",
        "description": "In 2006-2007 a group of investors bet against the US mortgage market. In their research, they discover how flawed and corrupt the market is.",
        "genre": {
            "name": "Drama",
            "description": "The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters."
        },
        "directors": {
            "name": "Adam McKay",
            "bio": "Adam McKay (born April 17, 1968) is an American screenwriter, director, comedian, and actor. McKay has a comedy partnership with Will Ferrell, with whom he co-wrote the films Anchorman, Talladega Nights, and The Other Guys. Ferrell and McKay also founded their comedy website Funny or Die through their production company Gary Sanchez Productions. He has been married to Shira Piven since 1999. They have two children.",
            "birth": 1968
        },
        "imageURL": "https://m.media-amazon.com/images/M/MV5BNDc4MThhN2EtZjMzNC00ZDJmLThiZTgtNThlY2UxZWMzNjdkXkEyXkFqcGdeQXVyNDk3NzU2MTQ@._V1_.jpg",
        "featured": true
    }
]


//creates and logs all access to the page on log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}));


app.get('/', (req, res) => {
    res.send("Welcome to myFlix API");
});

// [READ] - Return list of ALL movies
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// [READ] - Return data about a single movie by title
app.get('/movies/:title', (req, res) => {
    const {title} = req.params;
    const movie = movies.find( movie => movie.title === title );

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('No such object')
    }
});

// [READ] - Return data about a genre by name/title (description)`
app.get('/movies/genre/:genreName', (req, res) => {
    const {genreName} = req.params;
    const genre = movies.find( movie => movie.genre.name === genreName ).genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('No such genre')
    }
});

// [READ] - Return data about a director by name (bio, birth year, death year)
app.get('/movies/directors/:directorName', (req, res) => {
    const {directorName} = req.params;
    const director = movies.find( movie => movie.directors.name === directorName ).directors;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('No such director')
    }
});

// [CREATE] - Allows new users to register
app.post('/users', (req, res) => {
    const newUser = req.body;

    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send('Users need names')
    }
});

// [UPDATE] - Allows users to update their username info (username)
app.put('/users/:id', (req, res) => {
    const {id} = req.params;
    const updatedUser = req.body;

    let user = users.find( user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('No such user.');
    }
});

// [CREATE] - Allow users to add a movie to their list of favorites
app.post('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find( user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
    } else {
        res.status(400).send('No such user.');
    }
});

// [DELETE] - Allow users to remove a movie from their list of favorites
app.delete('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find( user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
    } else {
        res.status(400).send('No such user.');
    }
});

// Allow existing users to deregister
app.delete('/users/:id', (req, res) => {
    const {id} = req.params;

    let user = users.find( user => user.id == id);

    if (user) {
        users = users.filter(user => user.id != id);
        res.status(200).send(`user ${id} has been deleted.`);
    } else {
        res.status(400).send('No such user.');
    }
});

// run app and default returns
app.use(express.static('public'));

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});