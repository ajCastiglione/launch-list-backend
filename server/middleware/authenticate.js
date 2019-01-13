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
  let token = req.header("x-auth");

  if (token) {
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
  } else {
    let pw = CryptoJS.AES.decrypt(
      req.header("createCommand"),
      process.env.CRYPTO_SECRET
    ).toString(CryptoJS.enc.Utf8);
    if (pw === process.env.USER_CREATION_CODE) {
      req.user = "createCommand";
      next();
    } else {
      res.status(401).send({
        err:
          "Code is incorrect. Please contact an administrator if you believe this was a mistake."
      });
      next();
    }
  }
};

module.exports = { authenticate, createUserAuth };
