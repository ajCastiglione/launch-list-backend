require("./config/config");
const listContent = require("./config/listContent.json");
// NPM Modules
const express = require("express");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");
const CryptoJS = require("crypto-js");
const bcrypt = require("bcryptjs");
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
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,PATCH,DELETE");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, x-auth, Content-Type, createcommand, creator"
  );
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

  if (req.user === "createCommand" || req.user.role === "admin") {
    user
      .save()
      .then(() => {
        return user.generateAuthToken();
      })
      .then(token => {
        res
          .header("x-auth", token)
          .send({ success: "added user successfully" });
      })
      .catch(e => {
        res.status(400).send({ err: "User already exists." });
      });
  } else {
    res.status(401).send({ e: "User role is too low to perform this action." });
  }
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
          .send({ code: token, role: user.role })
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

    users.map(el => {
      info.push(_.pick(el, ["_id", "email", "role", "username"]));
    });

    res.send(info);
  });
});

// User account
app.get("/users/me", authenticate, (req, res) => {
  res.header("x-auth", req.token).send({ user: req.user });
});

// Updates signedin user
app.patch("/users/me", authenticate, (req, res) => {
  let body = _.pick(req.body, [
    "username",
    "profile_img",
    "profile_pg_bg",
    "email",
    "password"
  ]);

  if (body.profile_img === "")
    body.profile_img =
      "https://s3.amazonaws.com/minervalists/default_user_icon.png";
  if (body.profile_pg_bg === "")
    body.profile_pg_bg =
      "https://s3.amazonaws.com/minervalists/panorama-bg.jpg";

  let uid = req.user._id;

  if (body.password) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(body.password, salt, (err, hash) => {
          resolve(hash);
        });
      });
    }).then(hash => {
      User.findOneAndUpdate(
        { _id: uid },
        {
          $set: {
            username: body.username,
            profile_img: body.profile_img,
            profile_pg_bg: body.profile_pg_bg,
            email: body.email,
            password: hash
          }
        },
        { new: true }
      )
        .then(user => {
          let userInfo = _.pick(user, [
            "email",
            "username",
            "profile_pg_bg",
            "profile_img"
          ]);
          res.send(userInfo);
        })
        .catch(e => res.status(400).send(e));
    });
  } else {
    User.findOneAndUpdate(
      { _id: uid },
      {
        $set: {
          username: body.username,
          profile_img: body.profile_img,
          profile_pg_bg: body.profile_pg_bg,
          email: body.email
        }
      },
      { new: true }
    )
      .then(user => {
        let userInfo = _.pick(user, [
          "email",
          "username",
          "profile_pg_bg",
          "profile_img"
        ]);
        res.send(userInfo);
      })
      .catch(e => res.status(400).send(e));
  }
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

  if (req.user.role !== "admin") {
    return res
      .status(401)
      .send({ err: "User role is too low to perform this action" });
  }

  // Add prevention from deleting signed in admin user.
  if (req.user.email === email) {
    return res.status(409).send({ err: "User cannot remove themselves." });
  } else {
    User.deleteUser(email)
      .then(doc =>
        res.send({ success: "Removed user successfully", user: doc })
      )
      .catch(e => res.status(400).send(e));
  }
});

/**
 * This section will be CRUD abilities for all lists
 */

// Add new list
app.post("/lists", authenticate, (req, res) => {
  let body = _.pick(req.body, ["listName", "type", "items"]);
  let items = body.items ? body.items : listContent[body.type];
  let listName = body.listName;
  let creator =
    req.user.role === "admin" && req.body.creator
      ? req.body.creator
      : req.user._id;

  let list = new List({
    items,
    listName,
    type: body.type,
    createdAt: new Date(),
    _creator: creator,
    email: req.user.email
  });

  list.save().then(doc => res.send(doc), e => res.status(400).send(e));
});

// GET all lists for authenticated user
app.get("/lists", authenticate, (req, res) => {
  List.find({ _creator: req.user._id })
    .then(lists => {
      res.send({ lists });
    })
    .catch(e => res.status(400).send(e));
});

// Get specific list type
app.get("/lists/:type", authenticate, (req, res) => {
  let type = req.params.type;

  List.find({ _creator: req.user._id, type })
    .then(lists => {
      res.send({ lists });
    })
    .catch(e => res.status(400).send(e));
});

// Get single list
app.get("/list/:id", authenticate, (req, res) => {
  let id = req.params.id;

  List.find({ _creator: req.user._id, _id: id })
    .then(list => {
      res.send({ list });
    })
    .catch(e => res.status(400).send(e));
});

// Update specific list - items only
app.patch("/list/:id", authenticate, (req, res) => {
  let id = req.params.id;
  let items = req.body.items;

  if (!ObjectID.isValid(id)) {
    return res.send(404).send({ err: "Checklist not found." });
  }

  if (items) {
    List.findOneAndUpdate(
      { _id: id, _creator: req.user.id },
      { $set: { items, completed: false, completedAt: null } },
      { new: true }
    )
      .then(list => {
        let totalComplete = 0;
        for (let item of items) {
          if (item.completed === true) totalComplete++;
        }
        if (totalComplete === items.length) {
          List.findOneAndUpdate(
            { _id: id, _creator: req.user.id },
            { $set: { completed: true, completedAt: new Date() } },
            { new: true }
          ).then(
            completeList => res.send(completeList),
            e => res.status(400).send(e)
          );
        } else {
          res.send(list);
        }
      })
      .catch(e => res.status(400).send(e));
  }
});

app.delete("/lists/:id", authenticate, (req, res) => {
  let id = req.params.id;
  let creator =
    req.user.role === "admin" && req.header("creator")
      ? req.header("creator")
      : req.user.id;

  if (!ObjectID.isValid(id)) {
    return res.send(404).send({ err: "Checklist not found." });
  }

  List.findOneAndRemove({ _id: id, _creator: creator })
    .then(list => {
      if (!list) {
        return res.status(404).send({ err: "Checklist could not be removed." });
      }
      res.send(list);
    })
    .catch(e => res.status(400).send(e));
});

/**
 * Admin section - will have all routes for administrative CRUD abilities
 */

// Get all lists
app.get("/all-lists", authenticate, (req, res) => {
  let role = req.user.role;

  if (role !== "admin")
    return res.status(401).send({ err: "User cannot perform this action." });

  List.find({})
    .then(lists => {
      res.send({ lists });
    })
    .catch(e => res.status(400).send({ err: e }));
});

app.listen(port, () => console.log("Server is running on port " + port));
