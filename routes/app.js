const express = require("express");

const router = express.Router();

const App = require("../models/App");

const fs = require("fs");
const jwt = require("express-jwt");
const publicKey = fs.readFileSync("./public.key", "utf8");
const guard = require("express-jwt-permissions")();
router.use(jwt({ secret: publicKey, algorithms: ["RS256"] }));

router.get("/", (req, res) => {
  App.find({}, (err, apps) => {
    if (err) return res.status(500).send("app.find err");
    res.send(apps);
  });
});

router.post("/", (req, res) => {
  let { name, url } = req.body;

  new App({
    name: name,
    url: url,
  }).save((err, app) => {
    if (err) return res.status(500).send("app.save err");
    res.send(app);
  });
});

router.get("/:appid", (req, res) => {
  let { appid } = req.params;

  App.findById(appid, (err, app) => {
    if (err) return res.status(500).send("app.findbyid err");
    if (!app) return res.status(404).send("app not found");
    res.send(app);
  });
});

module.exports = router;
