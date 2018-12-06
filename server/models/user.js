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
  credentials: [
    {
      token: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    }
  ]
});

const User = mongoose.model("User", UserSchema);

module.exports = { User };
