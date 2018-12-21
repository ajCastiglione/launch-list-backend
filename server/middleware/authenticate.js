const { User } = require("./../models/user");
const CryptoJS = require("crypto-js");

const authenticate = (req, res, next) => {
  let token = req.header("x-auth");

  User.findByToken(token)
    .then(user => {
      if (!user) {
        return Promise.reject();
      }
      req.user = user;
      req.token = token;
      next();
    })
    .catch(e => {
      res.status(401).send(e);
    });
};

const createUserAuth = (req, res, next) => {
  let pw = CryptoJS.AES.decrypt(
    req.header("superCommand"),
    process.env.CRYPTO_SECRET
  );

  if (pw === process.env.USER_CREATION_CODE) {
    next();
  } else {
    res.status(401).send({
      err:
        "Code is incorrect. Please contact an administrator if you believe this was a mistake."
    });
  }
};

module.exports = { authenticate, createUserAuth };
