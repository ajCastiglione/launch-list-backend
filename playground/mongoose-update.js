require("./../server/config/config");
const mongoose = require("mongoose");
const { User } = require("./../server/models/user");

mongoose.promise = global.Promise;
mongoose.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true }
);

User.findByCredentials("jag@mail.com", "password")
  .then(user => {
    user.removeCredentials();
  })
  .catch(e => console.log(e));
