const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser')
const uuid = require('uuid')
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixAPI', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());


//creates and logs all access to the page on log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})
app.use(morgan('combined', {stream: accessLogStream}));


app.get('/', (req, res) => {
    res.send("Welcome to myFlix API");
});

// [READ] - Return list of ALL movies
app.get('/movies', (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// [READ] - Return data about a single movie by title
app.get('/movies/:Title', (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});``

// [READ] - Return data about a genre by name/title (description)`
app.get('/movies/genre/:Name', (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.Name })
        .then((foundMovie) => {
            res.status(201).json(foundMovie.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get('/movies/director/:Name', (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
      .then((foundMovie) => {
        res.status(201).json(foundMovie.Director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send(`Error: ${err}`);
      });
  });

// [READ] - Return data about all users
app.get('/users', (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err)
        });
});

// [CREATE] - Allows new users to register
app.post('/users', (req, res) => {
    Users.findOne({ Username: req.body.Username})
        .then ((user) => {
            if (user) {
                res.status(400).send( req.body.Username + " already exist.")
            }
            Users.create({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
                .then((createdUser) => {res.status(201).json(createdUser); })
                .catch((error) => {
                    res.status(500).send("Error: " + error)
                });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send("Error: " + err)
        });
});

// [UPDATE] - Allows users to update their username info (username)
app.put('/users/:_id', (req, res) => {
    Users.findOneAndUpdate(
        {_id: req.params._id},
        {
            $set: {
                Username: req.body.Username
            }
        },
        {new: true},
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send(`Error: ${err}`);
            } else {
                res.json(updatedUser);
            }
        }
    )
});

// [CREATE] - Allow users to add a movie to their list of favorites
app.post('/users/:_id/favoriteMovies/:movieID', (req, res) => {
    Users.findOneAndUpdate(
        {_id: req.params._id},
        {$addToSet: {FavoriteMovies: req.params.movieID}},
        {new: true},
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send(`Error: ${err}`);
            } else {
                res.json(updatedUser);
            }
        }
    )
});

// [DELETE] - Allow users to remove a movie from their list of favorites
app.delete('/users/:_id/favoriteMovies/:movieID', (req, res) => {
      Users.findOneAndUpdate({_id: req.params._id},
    { 
     $pull:{FavoriteMovies: req.params.movieID} 
    },
    {new: true},
    (err, updatedUser) => {
    if (err) {
        console.error(err);
        res.send(err)
    }
    else {
        res.json(updatedUser)
    }
    });
});

// Allow existing users to deregister
app.delete('/users/:Username', (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + " was not found.") 
            } else {
                res.status(200).send(req.params.Username + " was deleted.")
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// run app and default returns
app.use(express.static('public'));``

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});

