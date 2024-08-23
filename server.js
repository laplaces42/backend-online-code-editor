require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
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
app.use(
  cors({
    origin: "https://frontend-online-code-editor.vercel.app/", // Replace with your frontend domain
    methods: "GET,POST,PUT,DELETE",
  })
);

const dbURI = process.env.MONGODB_URI;

mongoose
  .connect(dbURI)
  .then((result) => {
    console.log("connected to db");

    app.listen(process.env.PORT);
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", homeRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/projects", projectRoutes);
