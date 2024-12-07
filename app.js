const express = require('express');
const cookieParser = require("cookie-parser");
const userModel = require("./models/user.js");
const postModel = require("./models/post.js");
const bcrypt = require("bcrypt");
const app = express();
const jwt = require("jsonwebtoken");
const path = require('path');

require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure the correct path to views
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.post('/signup', async (req, res) => {
  let { username, name, password, email, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    return res.status(400).send({ error: "Email already exists" });
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      if (err) throw err;
      let newUser = await userModel.create({ username, name, password: hash, email, age });
      await newUser.save();
      let token = jwt.sign({ email, userId: newUser._id }, "deep");
      res.cookie("token", token);
      res.redirect("/login");
    });
  });
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).send({ error: "Invalid email or password" });
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (err) throw err;
    if (!result) {
      return res.status(400).send({ error: "Invalid email or password" });
    } else {
      let token = jwt.sign({ email, userId: user._id }, "deep");
      res.cookie("token", token);
      res.redirect("/profile");
    }
  });
});

app.get("/profile", islogedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let posts = await postModel.find().populate('user');
  res.render("profile.ejs", { user, posts });
});

app.get('/delete/:id', islogedin, async (req, res) => {
  let post = await postModel.findById(req.params.id).populate('user');
  if (post.user.email === req.user.email) await postModel.deleteOne({ _id: req.params.id });
  res.redirect("/profile");
});

app.post('/posts', islogedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await postModel.create({
    content,
    user: user._id
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

function islogedin(req, res, next) {
  if (!req.cookies.token) {
    res.redirect("/login");
  } else {
    jwt.verify(req.cookies.token, "deep", (err, user) => {
      if (err) {
        res.redirect("/login");
      } else {
        req.user = user;
        next();
      }
    });
  }
}

// Export the app for Vercel
module.exports = app;