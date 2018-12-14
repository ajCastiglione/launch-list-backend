require("./config/config");
// NPM Modules
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");
const CryptoJS = require("crypto-js");
const _ = require("lodash");

// Local Modules
require("./db/mongoose");
const { User } = require("./models/user");
const { List } = require("./models/list");
const { authenticate, createUserAuth } = require("./middleware/authenticate");

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

/**
 * The first section will contain routes for user CRUD abilities.
 */

// Create new user - this will have to be modified so only admin can create users and not have it open so anyone can sign up
app.post("/users/add", createUserAuth, (req, res) => {
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
    });
});

// Login for existing user
app.post("/users/login", (req, res) => {
  let body = _.pick(req.body, ["email", "password"]);

  User.findByCredentials(body.email, body.password)
    .then(user => {
      if (user.credentials !== []) {
        user.credentials = [];
      }
      return user.generateAuthToken().then(token =>
        res
          .header("x-auth", token)
          .status(200)
          .send({ code: token })
      );
    })
    .catch(e => {
      res.status(400).send({ errMsg: e });
    });
});

// GET all users
app.get("/users", authenticate, (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(401)
      .send({ err: "User role is too low to perform this action" });

  User.find({}).then(users => {
    let info = [];

    users.map((el, idx) => {
      info.push(_.pick(el, ["_id", "email", "role"]));
    });

    res.send(info);
  });
});

// User account - will be basic res for now
app.get("/users/me", authenticate, (req, res) => {
  res.header("x-auth", req.token).send(req.user);
});

// Signs out authenticated user
app.delete("/users/signout", authenticate, (req, res) => {
  req.user
    .removeCredentials(req.token)
    .then(() => res.send({ success: `Signed user out successfully` }))
    .catch(e => res.send({ err: `Unable to complete operation: ${e}` }));
});

// Remove user - will have to be admin role or some role that has 1 superadmin power
app.delete("/users/remove/:email", authenticate, (req, res) => {
  let email = req.params.email;
  if (req.user.role !== "admin")
    return res
      .status(401)
      .send({ err: "User role is too low to perform this action" });

  User.deleteUser(email)
    .then(removedUser => res.send(removedUser))
    .catch(e => res.status(400).send(e));
});

/**
 * This section will be CRUD abilities for all lists
 */

app.post("/lists", authenticate, (req, res) => {
  let body = _.pick(req.body, ["items", "type"]);
  let list = new List({
    items: body.items,
    type: body.type,
    _creator: req.user._id
  });

  list.save().then(doc => res.send(doc), e => res.status(400).send(e));
});

app.get("/lists", authenticate, (req, res) => {
  List.find({ _creator: req.user._id })
    .then(lists => {
      res.send({ lists });
    })
    .catch(e => res.status(400).send(e));
});

app.patch("/lists/:id", authenticate, (req, res) => {
  let id = req.params.id;
  let items = req.body.items;

  if (!ObjectID.isValid(id)) {
    return res.send(404).send({ err: "Checklist not found." });
  }

  if (items) {
    List.findOneAndUpdate(
      { _id: id, _creator: req.user.id },
      { $set: { items } },
      { new: true }
    )
      .then(list => res.send(list))
      .catch(e => res.status(400).send(e));
  }
});

app.delete("/lists/:id", authenticate, (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.send(404).send({ err: "Checklist not found." });
  }

  List.findOneAndRemove({ _id: id, _creator: req.user.id })
    .then(list => {
      if (!list) {
        return res.status(404).send({ err: "Checklist could not be removed." });
      }
      res.send(list);
    })
    .catch(e => res.status(400).send(e));
});

app.listen(port, () => console.log("Server is running on port " + port));
