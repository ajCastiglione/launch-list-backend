const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

let UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "Incorrect email address format"
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true
  },
  credentials: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

// Attached to the schema
UserSchema.methods.generateAuthToken = function() {
  let user = this;
  let access = "auth";
  let token = jwt
    .sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET)
    .toString();

  user.credentials = user.credentials.concat([{ access, token }]);

  return user.save().then(() => {
    return token;
  });
};

// Attached to the schema
UserSchema.methods.removeCredentials = function() {
  let user = this;
  user.credentials = [];
  return user;
};

// This is attached to the Model
UserSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    "credentials.token": token,
    "credentials.access": "auth"
  });
};

// Attached to model - finds and authenticates existing user
UserSchema.statics.findByCredentials = function(email, password) {
  let User = this;

  return User.findOne({ email }).then(user => {
    if (!user) {
      return Promise.reject("User does not exist");
    }
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject("Authentication failed!");
        }
      });
    });
  });
};

// Attached to model - removes user based on email
UserSchema.statics.deleteUser = function(email) {
  let User = this;

  return User.findOneAndRemove({ email }).then(err => {
    return new Promise((resolve, reject) => {
      if (err) reject(err);
      resolve(`Successfully removed the user ${email}`);
    });
  });
};

// Encrypting password before saving to database - attached to schema user
UserSchema.pre("save", function(next) {
  let user = this;

  if (user.isModified("password")) {
    // Encrypt passowrd
    bcrypt.genSalt(10, (err, salt) => {
      // Set user password to hash
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        // use next() to continue
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model("User", UserSchema);

module.exports = { User };
