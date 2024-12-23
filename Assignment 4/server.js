const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(session({
  secret: "My session secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const adminRouter = require("./routes/admin/router");
app.use(expressLayouts);

app.use(adminRouter);

const connectionString = "mongodb://127.0.0.1:27017/sp23-bse-a-0";
mongoose
  .connect(connectionString)
  .then(() => {
    console.log(`Connected to MongoDB: ${connectionString}`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

app.listen(5001, () => {
  console.log(`Server started on port 5001`);
});
