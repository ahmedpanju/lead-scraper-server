const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const path = require("path");
const { initializeApp } = require("firebase/app");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb" }));
app.use(helmet());
app.use(cors());
const firebaseApp = initializeApp(firebaseConfig);

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
const openAi = require("./src/routes/openAi");
const twitter = require("./src/routes/twitter");
const { default: axios } = require("axios");

app.use("/github", github);
app.use("/airtable", airtable);
app.use("/openAi", openAi);
app.use("/twitter", twitter);

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
