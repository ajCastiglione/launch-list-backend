require("./config/config");
// NPM Modules
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

// Local Modules
const { mongoose } = require("./db/mongoose");
const { User } = require("./models/user");
const { authenticate } = require("./middleware/authenticate");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");

  res.header("Access-Control-Allow-Headers", "Origin, x-auth, Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.send("home route");
});

// Create new user - this will have to be modified so only I can create users and not have it open so anyone can sign up
app.post("/users", (req, res) => {
  let body = _.pick(req.body, ["email", "password", "role"]);
  let user = new User(body);

  user
    .save()
    .then(() => {
      return user.generateAuthToken();
    })
    .then(token => {
      res.header("x-auth", token).send(user);
    })
    .catch(e => {
      res.status(400).send(e);
      User.deleteOne({ email: body.email }, err => {
        if (err) {
          console.log("Couldn't remove user by email", err);
        } else {
          console.log("Removed false signup");
        }
      });
    });
});

// Login for existing user
app.post("/users/login", (req, res) => {
  let body = _.pick(req.body, ["email", "password"]);

  User.findByCredentials(body.email, body.password)
    .then(user => {
      user.removeCredentials();
      return user
        .generateAuthToken()
        .then(token => res.header("x-auth", token).send(user));
    })
    .catch(e => {
      res.status(400).send({ errMsg: e });
    });
});

app.post("/secured-route", authenticate, (req, res) => {});

app.listen(port, () => console.log("Server is running on port " + port));
