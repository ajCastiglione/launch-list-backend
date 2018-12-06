const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  if (!req.body.headers) {
    return res.status(401).send({
      err: "Unauthorized, invalid token. Please try signing in again."
    });
  }

  let token = req.body.headers["x-auth"].token
    ? req.body.headers["x-auth"].token
    : req.body.headers["x-auth"];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).send({
      err: "Unauthorized, invalid token. Please try signing in again."
    });
  }

  next();
};

module.exports = {
  authenticate
};
