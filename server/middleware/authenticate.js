const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  if (!req.headers) {
    return res.status(401).send({
      err: "Unauthorized, invalid token. Please try signing in again."
    });
  }

  let token = req.header("x-auth"),
    decoded;

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
      res.status(401).send();
    });
};

module.exports = {
  authenticate
};
