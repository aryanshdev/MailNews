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
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

let dbClient = redis.createClient();

app.use(express.static("src"));

app.listen(3000, async () => {
  // await dbClient.connect();
 // await newsWritter.generateNewsFiles();
  console.log("SERVER RUNNING ON PORT 3000");
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

app.get("/news", (req, res) => {
  var business, entertainment, science, sports, tech, world;

  var business = JSON.parse(
    fileSystem.readFileSync(
      __dirname + "/businessNews.json",
      (error, data) => {}
    )
  );

  var entertainment = JSON.parse(
    fileSystem.readFileSync(
      __dirname + "/entertainmentNews.json",
      (error, data) => {}
    )
  );

  var science = JSON.parse(
    fileSystem.readFileSync(
      __dirname + "/scienceNews.json",
      (error, data) => {}
    )
  );

  var sports = JSON.parse(
    fileSystem.readFileSync(__dirname + "/sportNews.json", (error, data) => {})
  );

  var tech = JSON.parse(
    fileSystem.readFileSync(__dirname + "/techNews.json", (error, data) => {})
  );

  var world = JSON.parse(fileSystem.readFileSync(
    __dirname + "/worldNews.json",
    (error, data) => {}
  ));

  res.render(__dirname + "/src/news.ejs", {
    businessNews: business,
    entertainmentNews: entertainment,
    scienceNews: science,
    sportsNews: sports,
    techNews: tech,
    worldNews: world,
  });
});
