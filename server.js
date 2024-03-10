const express = require("express");
const redis = require("redis");
const bodyParser = require("body-parser");
const session = require("express-session");
let newsWritter = require("./newsGetter");
const fileSystem = require("fs");
const app = express();

app.use(
  session({
    secret: "MailNews-Secret",
    saveUninitialized: true,
    cookie: { maxAge: 1800000 },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

let dbClient = redis.createClient();

app.use(express.static("src"));

app.listen(3000, async () => {
//   await dbClient.connect();
  await newsWritter.generateNewsFiles();
  console.log("SERVER RUNNING ON PORT 3000");
  process.exit(0);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/index.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/src/dashboard.html");
});

app.post("/subscribe", async (req, res) => {
  if (!dbClient.get(req.body.email)) {
    await dbClient.set(req.body.email, req.body.name);
    res.send("SUBSCRIBED ");
  } else {
    res.send("ALREADY SUBSCRIBED");
  }
});
