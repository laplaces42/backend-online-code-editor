require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");

const Account = require("./models/account");
const Project = require("./models/project");
const File = require("./models/file");

const homeRoutes = require("./routes/homeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true if using HTTPS
  })
);

// const dbURI =
//   "mongodb+srv://laplaces42:Swagdude1@cluster0.2jbw2.mongodb.net/accounts?retryWrites=true&w=majority&appName=Cluster0";

const dbURI = process.env.MONGODB_URI

mongoose
  .connect(dbURI)
  .then((result) => {
    console.log("connected to db");

    app.listen(4000);
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", homeRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/projects", projectRoutes);
