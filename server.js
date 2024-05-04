const express = require("express");
const cron = require("node-cron");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
let newsWritter = require("./newsGetter");
const sql = require("sqlite3").verbose();
const fileSystem = require("fs");
const crypto = require("crypto");
const e = require("express");
require("dotenv").config();

const verificationMailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
  body {
    padding: 2.5%;
  }
    .container {
      background-color: rgb(2, 6, 23);
      text-align: center;
      font-family: sans-serif;
      color: white;
      margin: 2.5%;
      padding: 2.5%;
      border-radius: 15px;
      border: 2.5px solid #009999;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>MailNews</p>
    <img src="cid:loder.png" width="35%" alt="Verification Code" />
    <hr>
    <h2>Your Verification Code Is</h2>
    <h1>VERIFICATION_CODE</h1>
    <p>
      This Code Is Valid For 10 Minutes <br>
      Don't Share It With Anyone <br>
      If You Did Not Request A Verification Code, Please Ignore This Email.
    </p>
  </div>
</body>
</html>
`;

const app = express();
app.use(
  session({
    secret: "MailNews-Secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1800000 },
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("src"));

let db = new sql.Database("mailNews.db", (err) => {});

db.run(
  "CREATE TABLE IF NOT EXISTS users (emailID TEXT PRIMARY KEY, emailHash TEXT NOT NULL, name TEXT NOT NULL, password TEXT NOT NULL, dos TEXT NOT NULL, interests TEXT NOT NULL, emailslot INTEGER NOT NULL, googleUID TEXT UNIQUE )"
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH2_CLIENT_ID,
      clientSecret: process.env.OAUTH2_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://mailnews.onrender.com/process-google-auth"
          : "http://localhost:10000/process-google-auth",
      scope: ["https://www.googleapis.com/auth/plus.login"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile._json);
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

let mailer = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: false,
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
    clientId: process.env.EMAILER_CLIENT_ID,
    clientSecret: process.env.EMAILER_CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

var slot = new Date().getUTCHours();

async function cronNews() {
  await newsWritter.generateNewsFiles();
  await emailCurrentSlot();
}

async function emailCurrentSlot() {
  await db.all(
    `SELECT * FROM users WHERE emailslot = ${slot}`,
    async (err, rows) => {
      if (rows) {
        rows.forEach(async (row) => {
          var body = `
          <style>
  body {
    font-family: Arial, sans-serif;
    margin: 2.5%;
    padding: 0;
    background-color: rgb(2 6 23);
    color: white;
    text-align: center;
  }
  p {
    text-align: left;
    margin: 0;
  }
  .content {
    border: 2px white solid;
    border-radius: 10px;
    padding: 5px;
  }
  .mainContent {
    display: block;
    align-items: center;
    columns: 1;
  }
  .mainContent img {
    display: block;
    margin: 0 auto;
    order: -1;
  }
  /* .mainContent p {
  } */
  @media (min-width: 765px) {
    .mainContent {
      columns: 3;
      gap: 1rem;
      display: grid; /* Ensure grid layout */
    }
    .mainContent p {
      grid-column: 2;
    }
    .mainContent img {
      grid-column: 1;
    }
  }
</style>
          <h1>MailNews</h1>
       <h3>Here Are Your Daily News</h3>
       `;
          row.interests.split(",").forEach((topic) => {
            body += `<h2>${topic}</h2>`;
            var news = JSON.parse(
              fileSystem.readFileSync(
                __dirname + `/${topic.toLowerCase()}News.json`,
                (error, data) => {}
              )
            );
            var count = 0;
            for (title in news) {
              body += `<div class='content'><h3>${title}</h3>
              <div class='mainContent'>
              <img src="${news[title].img}" width="100%" alt="${title}" />
           <p >${news[title].content}</p>
           </div>
           <a href="${news[title].link}">Read More</a>
           <hr></div>`;
              count++;
              if (count == 5) break;
            }
            body += `<a href='https://mailnews.onrender.com/news#1${topic}' > Read All ${topic} News</a> <br>`;
          });
          await mailer.sendMail({
            to: row.emailID,
            from: `MailNews ${process.env.EMAIL}`,
            subject: "MailNews | Your Daily News",
            html: body,
          });
        });
      }
    }
  );

  slot++;
  if (slot == 24) {
    slot = 0;
  }
}

cron.schedule("0 * * * *", cronNews);

function inSubscribingProcessCheck(req, res, next) {
  if (req.session.currentSubs) {
    return next();
  } else {
    res.redirect("/signin");
  }
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.loggedin) {
    return next();
  }
  res.status(401).redirect("/signin");
}
app.listen(process.env.PORT || 3000, () => {
  console.log("SERVER RUNNING ON PORT " + (process.env.PORT || 3000));
});

app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/src/index.html");
});

app.post("/signin", (req, res) => {
  db.get(
    `SELECT * FROM users WHERE emailID = "${req.body.email}"`,
    (err, row) => {
      if (row) {
        if (
          row.password ==
          crypto.createHash("sha256").update(req.body.pass).digest("hex")
        ) {
          req.session.loggedin = row.emailID;
          if (req.body.saveLogin === "true") {
            res.cookie(
              "__logcred__",
              crypto.createHash("sha256").update(req.body.email).digest("hex") +
                "$" +
                crypto.createHash("sha256").update(req.body.pass).digest("hex"),
              { maxAge: 3600000 * 24 * 7, httpOnly: true }
            );
          }
          res.status(200).redirect("/dashboard");
        } else {
          res
            .status(401)
            .send("Wrong Password, Check Credentials And Try Again");
        }
      } else {
        res
          .status(404)
          .send("Account Not Found, Check Credentials And Try Again");
      }
    }
  );
});

app.get("/dashboard", ensureAuthenticated, (req, res) => {
  if (req.user && !req.loggedin) {
    req.session.loggedin = req.user.email;
  }
  let email = req.session.loggedin;
  db.get(`SELECT * FROM users WHERE emailID = "${email}"`, (err, row) => {
    if (row) {
      res.render(__dirname + "/src/dashboard.ejs", {
        isLoggedIn: true,
        selectedTopicsString: row.interests,
        timeSlot: row.emailslot,
        googleAuth: row.googleUID,
      });
    } else {
      res.status(404).send("Account Not Found");
    }
  });
});

app.post("/updateTopics", (req, res) => {
  if (req.session.loggedin) {
    db.run(
      "UPDATE users SET interests = ? WHERE emailID = ?",
      [req.body.topics, req.session.loggedin],
      (err, a) => {
        if (err) {
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      }
    );
  } else {
    res.sendStatus(401);
  }
});

app.post("/updateSlot", (req, res) => {
  if (req.session.loggedin) {
    db.run(
      "UPDATE users SET emailslot = ? WHERE emailID = ?",
      [req.body.timeSlot, req.session.loggedin],
      (err, a) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      }
    );
  } else {
    res.sendStatus(401);
  }
});

app.post("/subscribe", (req, res) => {
  db.get(
    `SELECT * FROM users WHERE emailID = "${req.body.email}"`,
    async (err, row) => {
      if (!row) {
        if (!req.session.currentSubs) {
          req.session.currentSubs = req.body;
          req.session.registrationCode = Math.random().toString().slice(3, 10);
          await mailer
            .sendMail({
              to: req.body.email,
              from: `MailNews ${process.env.EMAIL}`,
              subject: "Verify Your Email | MailNews",
              html: verificationMailBody.replace(
                "VERIFICATION_CODE",
                req.session.registrationCode
              ),
            })
            .catch((err) => {
              console.log(err);
            });
          res.status(200).send("Verification Code Sent");
        } else {
          res.redirect("/verify");
        }
      } else {
        res.status(409).send("Email Already Registered");
      }
    }
  );
});

app.get("/verify", inSubscribingProcessCheck, (req, res) => {
  res.sendFile(__dirname + "/src/emailverify.html");
});

app.post("/verifyEmail", inSubscribingProcessCheck, async (req, res) => {
  if (req.body.verificationCode == req.session.registrationCode) {
    db.run(
      `INSERT INTO users (emailID, emailHash, name, password, dos, interests, emailslot) VALUES(
        "${req.session.currentSubs.email}",
        "${crypto
          .createHash("sha256")
          .update(req.session.currentSubs.email)
          .digest("hex")}",
        "${req.session.currentSubs.name}",
        "${crypto
          .createHash("sha256")
          .update(req.session.currentSubs.pass)
          .digest("hex")}",
        "${new Date().toISOString()}",
        "${req.session.currentSubs.topics}",
        ${req.session.currentSubs.slot})`,
      (err) => {
        console.log(err);
        if (err) {
          res.status(400).send("Email Already Registered");
        } else {
          delete req.session.registrationCode;
          res.redirect("/registration-successful");
        }
      }
    );
  } else {
    res.status(400).send("Invalid Code");
  }
});

app.get(
  "/connect-google",
  inSubscribingProcessCheck,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/connect-google-post",
  ensureAuthenticated,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/disconnect-google", ensureAuthenticated, (req, res) => {
  req.logout(() => {});
  db.run(
    `UPDATE users SET googleUID = NULL WHERE emailID = '${req.session.loggedin}'`,
    (err) => {
      if (err) {
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    }
  );
});

app.get(
  "/google-login",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/process-google-auth",
  passport.authenticate("google", {
    failureRedirect: "/signin",
    successRedirect: "/google-auth-success",
    keepSessionInfo: true,
  })
);

app.get("/google-auth-success", ensureAuthenticated, (req, res) => {
  if (req.session.loggedin) {
    db.run(
      `UPDATE users SET googleUID = '${req.user.sub}' WHERE emailID = '${req.session.loggedin}'`,
      (err) => {
        if (err) {
          res.status(500).send("Error");
        } else {
          res.redirect("/dashboard");
          return;
        }
      }
    );
  } else {
    if (req.session.currentSubs) {
      res.redirect("/connect-google-success");
    } else {
      db.get(
        `SELECT * FROM users WHERE googleUID = '${req.user.sub}'`,
        (err, row) => {
          if (row) {
            req.session.loggedin = row.emailID;
            req.user.email = row.emailID;
            res.redirect("/dashboard");
          } else {
            res.status(500).send("Error");
          }
        }
      );
    }
  }
  delete req.session.currentSubs;
});

app.get("/connect-google-success", (req, res) => {
  db.run(
    `UPDATE users SET googleUID = '${req.user.sub}' WHERE emailID = '${req.session.currentSubs.email}'`,
    (err) => {
      if (err) {
        res.status(500).send("Error");
      } else {
        delete req.session.currentSubs;
        res.render(__dirname + "/src/google_auth_success.ejs", {
          email: req.user.email,
        });
      }
    }
  );
});

app.get("/registration-successful", inSubscribingProcessCheck, (req, res) => {
  res.sendFile(__dirname + "/src/register_success.html");
});
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/src/signup.html");
});

app.get("/signin", (req, res) => {
  res.redirect("/login");
});
app.get("/login", (req, res) => {
  delete req.session.currentSubs;
  res.sendFile(__dirname + "/src/signin.html");
});
app.get("/autologin", (req, res) => {
  if (req.cookies.__logcred__) {
    res.sendStatus(202);
  }
});

app.post("/autologin", (req, res) => {
  var [hashedEmail, hashedPass] = req.cookies.__logcred__.split("$");
  db.get(
    `SELECT * FROM users WHERE emailHash = "${hashedEmail}"`,
    (err, row) => {
      if (row) {
        if (row.password == hashedPass) {
          req.session.loggedin = row.emailID;
          res.status(200).redirect("/dashboard");
        } else {
          res.sendStatus(406);
        }
      } else {
        res.sendStatus(406);
      }
    }
  );
});

app.post("/changeName", ensureAuthenticated, (req, res) => {
  if (req.session.loggedin) {
    db.run(
      `UPDATE users SET name = '${req.body.name}' WHERE emailID = '${req.session.loggedin}'`,
      (err) => {
        if (err) {
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      }
    );
  } else {
    res.sendStatus(401);
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
    fileSystem.readFileSync(__dirname + "/sportsNews.json", (error, data) => {})
  );

  var tech = JSON.parse(
    fileSystem.readFileSync(__dirname + "/techNews.json", (error, data) => {})
  );

  var world = JSON.parse(
    fileSystem.readFileSync(__dirname + "/worldNews.json", (error, data) => {})
  );

  res.render(__dirname + "/src/news.ejs", {
    isLoggedIn: req.isAuthenticated() || req.session.loggedin,
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
  res.status(404).sendFile(__dirname + "/src/404.html");
});
