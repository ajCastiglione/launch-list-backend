// NPM Modules
const express = require("express");
const bodyParser = require("body-parser");

// Local Modules
const { authenticate } = require("./middleware/authenticate");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");

  res.header("Access-Control-Allow-Headers", "Origin, x-auth, Content-Type");
  next();
});

app.get("/", (req, res) => {});

app.post("/secured-route", authenticate, (req, res) => {});

app.listen(port, () => console.log("Server is running on port " + port));
