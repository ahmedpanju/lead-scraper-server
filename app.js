const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb" }));
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

const github = require("./src/routes/github");
const airtable = require("./src/routes/airtable");

app.use("/github", github);
app.use("/airtable", airtable);

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
