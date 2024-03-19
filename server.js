const express = require("express");
const cron = require("node-cron");
const bodyParser = require("body-parser");
const session = require("express-session");
let newsWritter = require("./newsGetter");
const sql = require("sqlite3").verbose();
const fileSystem = require("fs");
const app = express();

let db = new sql.Database("mailNews.db", (err) => {});
db.run("drop table if exists users");
db.run(
  "CREATE TABLE IF NOT EXISTS users (emailID TEXT PRIMARY KEY, name TEXT, password TEXT NOT NULL, dos DATE NOT NULL, emailslot INTEGER)"
);

async function cronNews(){
  const currentDate = new Date();
const formattedDateTime = `${currentDate.toLocaleDateString()}, ${currentDate.toLocaleTimeString()}`;

console.log("Current date and time:", formattedDateTime);
  await newsWritter.generateNewsFiles();
  console.log("News Updated");
}

cron.schedule("0 */2 * * *", cronNews);



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

app.use(express.static("src"));

app.listen(10000 , async () => {
  const currentDate = new Date();
const formattedDateTime = `${currentDate.toLocaleDateString()}, ${currentDate.toLocaleTimeString()}`;

console.log("Current date and time:", formattedDateTime);
  console.log("SERVER RUNNING ON PORT 10000 ");
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

app.get("/signup", (req,res)=>{
  res.sendFile(__dirname+"/src/signup.html")
})

app.get("/signin", (req,res)=>{
  res.sendFile(__dirname+"/src/signin.html")
})

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

  var world = JSON.parse(
    fileSystem.readFileSync(__dirname + "/worldNews.json", (error, data) => {})
  );

  res.render(__dirname + "/src/news.ejs", {
    businessNews: business,
    entertainmentNews: entertainment,
    scienceNews: science,
    sportsNews: sports,
    techNews: tech,
    worldNews: world,
  });
});

app.get("/ping", (req, res) => {
  res.status(200).send("<h1>PONG<h1>");
});

// At Last
app.get("*", (req, res) => {
  res.status(404).send("<h1>Woops! Page Not Found!</h1>");
});
