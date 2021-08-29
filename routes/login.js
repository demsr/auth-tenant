const express = require("express");

const router = express.Router();
const Auth = require("../models/Auth");
const App = require("../models/App");
const { nanoid } = require("nanoid");
const redis = require("../db/Redis");

router.get("/", (req, res) => {
  res.redirect("/login");
});

router.get("/logout", (req, res) => {
  let { refreshtoken } = req.cookies;

  //if (!refreshtoken) return res.status(400).send("no refresh cookie found");

  redis.del(refreshtoken);

  res.cookie("refreshtoken", "", { expires: 0, httpOnly: true });

  res.render("pages/logout");
});

router.get("/login", (req, res) => {
  let { appid } = req.query;

  res.render("pages/login", { appid: appid });
});

router.post("/login", (req, res) => {
  let { username, password, appid } = req.body;

  Auth.findOne({ username: username }, (err, user) => {
    if (err) return res.status(500).send("User.findOne error");
    if (!user) return res.status(404).send("User not found");

    user.comparePassword(password, (err, isMatch) => {
      if (err)
        return res.status(500).send({ message: "User.comparePassword error" });
      if (isMatch) {
        let accesstoken = nanoid(64);
        redis.set(accesstoken, user._id);
        console.log(appid);
        if (appid) {
          App.findById(appid, (err, app) => {
            if (err) return res.status(500).send("app.findone error");
            if (!app) return res.status(404).send("app not found");

            res.redirect(`${app.url}/token=${accesstoken}`);
          });
        } else {
          App.findOne({ default: true }, (err, app) => {
            if (err) return res.status(500).send("app.find error");
            if (!app) return res.status(404).send("app not found");

            res.redirect(`${app.url}?token=${accesstoken}`);
          });
        }
      } else {
        res.status(400).send({ message: "Wrong password" });
      }
    });
  });
});

router.get("/register", (req, res) => {
  let { invite } = req.query;
  if (!invite) return res.send("invitecode required");

  res.render("pages/register", { invite: invite });
});

router.post("/register", (req, res) => {
  console.log(req.body);
  let { username, password, password2, invite } = req.body;

  if (!invite) return res.send("invite required");

  new Auth({
    username: username,
    password: password,
  }).save((err, user) => {
    if (err) return res.status(500).send("could not save user", err);
    res.status(200).send("user created");
  });
});

module.exports = router;
