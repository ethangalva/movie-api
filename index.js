const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs')
const bodyParser = require('body-parser')
const uuid = require('uuid')
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
const { check, validationResult } = require('express-validator');

const Movies = Models.Movie;
const Users = Models.User;

const cors = require('cors');
app.use(cors());
// let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

// app.use(cors({
//   origin: (origin, callback) => {
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
//       let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
//       return callback(new Error(message ), false);
//     }
//     return callback(null, true);
//   }
// }));

// mongoose.connect('mongodb://localhost:27017/myFlixAPI', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


app.use(bodyParser.json());

let auth = require('./auth')(app);
const passport = require('passport');
const { hashSync } = require('bcrypt');
const { application } = require('express');
require('./passport');

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
app.get('/movies/:Title', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// [READ] - Return data about a genre by name/title (description)
app.get('/movies/genre/:Name', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.Name })
        .then((foundMovie) => {
            res.status(201).json(foundMovie.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

app.get('/movies/director/:Name', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.get('/users', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.post('/users',
  // Validation logic here for request
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
        .then((user) => {
            if (user) {
            //If the user is found, send a response that it already exists
            return res.status(400).send(req.body.Username + ' already exists');
        } else {
            Users
                .create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                .then((user) => { res.status(201).json(user) })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// [UPDATE] - Allows users to update their username info (username)
app.put('/users/:_id', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.post('/users/:_id/favoriteMovies/:movieID', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.delete('/users/:_id/favoriteMovies/:movieID', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
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
app.use(express.static('public'));

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
});