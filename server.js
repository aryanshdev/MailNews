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
      border: 2.7.5px solid #009999;
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

const tempPassMailBody = `
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
      border: 2.7.5px solid #009999;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>MailNews</p>
    <img src="cid:loder.png" width="35%" alt="Verification Code" />
    <hr>
    <h2>Your Temporary Password Is</h2>
    <h1>TEMP_PASS</h1>
    <p>
    Use this Temporary password to login and then change password from dashboard. <br>
    Dont't Share It With Anyone <br>
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

var port = 10000;

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
          : `http://localhost:${port}/process-google-auth`,
      scope: ["https://www.googleapis.com/auth/plus.login"],
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile._json);
    }
  )
);
var singleNewsBlock = `<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
style="mso-table-lspace: 0; mso-table-rspace: 0; background-color: #020617; margin-top:7.5px; margin-bottom:7.5px; border: 2px white solid; padding: 1.5%; border-radius: 10px; width: 100%;">
<tbody>
   <tr>
      <td class="pad">
         <div class="alignment" align="center">
            <!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:38px;width:110px;v-text-anchor:middle;" arcsize="11%" stroke="false" fillcolor="#3AAEE0">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center style="color:#ffffff; font-family:Arial, sans-serif; font-size:14px">
<![endif]-->
            <h1 style="font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
            font-size:16px;
            margin: 0;
            color: #fff;">
               $HEADING$
            </h1>
            <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
         </div>
      </td>
   </tr>
   <tr>
      <td>
         <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0"
            role="presentation" style="
     mso-table-lspace: 0;
     mso-table-rspace: 0;
     background-color: #020617;
   ">
            <tbody>
               <tr class="reverse">
                  <td class="column column-1 first" width="66.66666666666667%" style="
         mso-table-lspace: 0;
         mso-table-rspace: 0;
         font-weight: 400;
         text-align: left;
         padding-bottom: 7.5px;
         padding-left: 7.5px;
         padding-right: 7.5px;
         padding-top: 7.5px;
         vertical-align: top;
         border-top: 0;
         border-right: 0;
         border-bottom: 0;
         border-left: 0;
       ">
                     <div class="border">
                        <table class="text_block block-1" width="100%" border="0" cellpadding="10" cellspacing="0"
                           role="presentation" style="
             mso-table-lspace: 0;
             mso-table-rspace: 0;
             word-break: break-word;
           ">
                           <tbody>
                              <tr>
                                 <td class="pad">
                                    <div style="font-family: sans-serif">
                                       <div class="" style="
                       font-size: 14px;
                       font-family: Arial, Helvetica Neue, Helvetica,
                         sans-serif;
                       mso-line-height-alt: 16.8px;
                       color: #fff;
                       line-height: 1.2;
                     ">
                                          <p style="margin: 0; mso-line-height-alt: 16.8px">
                                         $CONTENT$
                                          </p>
                                       </div>
                                    </div>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </td>
                  <td class="column column-2 last" width="33.333333333333336%" style="
         mso-table-lspace: 0;
         mso-table-rspace: 0;
         vertical-align: middle;
         font-weight: 400;
         text-align: left;
         border-top: 0;
         border-right: 0;
         border-bottom: 0;
         border-left: 0;
       ">
                     <div class="border">
                        <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0"
                           role="presentation" style="mso-table-lspace: 0; mso-table-rspace: 0">
                           <tbody>
                              <tr>
                                 <td class="pad" style="width: 100%">
                                    <div class="alignment" align="center" style="line-height: 10px">
                                       <div style="max-width: 298.66666666666663px">
                                          <img
                                             src="$IMG_SRC$"
                                             style="
                         display: block;
                         height: auto;
                         border: 0;
                         width: 100%;
                       " width="298.66666666666663" height="auto">
                                       </div>
                                    </div>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                  </td>
               </tr>

            </tbody>
         </table>
      </td>
   </tr>

   <tr>
      <td class="pad">
         <div class="alignment" align="center">
            <!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:38px;width:110px;v-text-anchor:middle;" arcsize="11%" stroke="false" fillcolor="#3AAEE0">
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center style="color:#ffffff; font-family:Arial, sans-serif; font-size:14px">
<![endif]-->
            <a href="$NEWS_LINK$" style="text-decoration: none;">
               <div style="
               text-decoration: none;
               display: inline-block;
               color: #020617;
               background-color: white;
               border-radius: 99px;
               width: auto;
               border-top: 0 solid transparent;
               font-weight: 600;
               border-right: 0 solid transparent;
               border-bottom: 0 solid transparent;
               border-left: 0 solid transparent;
               padding-top: 7.5px;
               padding-bottom: 7.5px;
               font-family: Arial, Helvetica Neue, Helvetica,
                 sans-serif;
               font-size: 14px;
               text-align: center;
               mso-border-alt: none;
               word-break: keep-all;
             ">
       <span style="
                 padding-left: 20px;
                 padding-right: 20px;
                 font-size: 14px;
                 display: inline-block;
                 letter-spacing: normal;
               "><span style="
                   word-break: break-word;
                   line-height: 28px;
                 ">Know More</span></span>
    </div></a>
            <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
         </div>
      </td>
   </tr>
</tbody>
</table>
`;

var newsEmailBodyStart = `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
   <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <!--[if mso
     ]><xml
       ><o:OfficeDocumentSettings
         ><o:PixelsPerInch>96</o:PixelsPerInch
         ><o:AllowPNG /></o:OfficeDocumentSettings></xml
   ><![endif]-->
   <style>
      * {
         box-sizing: border-box;
      }

      body {
         margin: 0;
         background-color: #020617;
         width: 100%;
         padding: 7.5px;
      }

      a[x-apple-data-detectors] {
         color: inherit !important;
         text-decoration: inherit !important;
      }

      #MessageViewBody a {
         color: inherit;
         text-decoration: none;
      }

      p {
         line-height: inherit;
      }

      .desktop_hide,
      .desktop_hide table {
         mso-hide: all;
         display: none;
         max-height: 0;
         overflow: hidden;
      }

      .image_block img+div {
         display: none;
      }

      @media (max-width: 600px) {
         .mobile_hide {
            display: none;
         }

         .row-content {
            width: 100% !important;
         }

         .stack .column {
            width: 100%;
            display: block;
         }

         .mobile_hide {
            min-height: 0;
            max-height: 0;
            max-width: 0;
            overflow: hidden;
            font-size: 0;
         }

         .desktop_hide,
         .desktop_hide table {
            display: table !important;
            max-height: none !important;
         }

         .reverse {
            display: table;
            width: 100%;
         }

         .reverse .column.first {
            display: table-footer-group !important;
         }

         .reverse .column.last {
            display: table-header-group !important;
         }

         .row-2 td.column.first .border {
            padding: 7.5px;
            border-top: 0;
            border-right: 0;
            border-bottom: 0;
            border-left: 0;
         }

         .row-2 td.column.last .border {
            padding: 0;
            border-top: 0;
            border-right: 0;
            border-bottom: 0;
            border-left: 0;
         }
      }
   </style>

<body style="margin:0;padding:10px;-webkit-text-size-adjust:none;text-size-adjust:none">`;

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

var slot = new Date().getUTCHours() + parseInt(new Date().getUTCMinutes() / 30);

async function cronNews() {
  await newsWritter.generateNewsFiles();
}
async function emailCurrentSlot() {
  console.log(slot);
  await db.all(
    `SELECT * FROM users WHERE emailslot = ${slot}`,
    async (err, rows) => {
      if (rows) {
        rows.forEach(async (row) => {
          var body = newsEmailBodyStart;
          body += `<div style="background-color:#020617; text-align:center; padding:12.5px 0px; margin:0px"><h1 style="font-size:21px">MailNews</h1><p style="font-weight:600">Your Daily Dose Of News And Information is Here!!</p><div>`;
          row.interests.split(",").forEach((topic) => {
            body += `<div style="background-color:#020617; text-align:center; padding:12.5px 0px; margin:0px"><h2>${topic} News</h2>`;
            var news = JSON.parse(
              fileSystem.readFileSync(
                __dirname + `/${topic.toLowerCase()}News.json`,
                (error, data) => {}
              )
            );
            var count = 0;
            for (title in news) {
              body += singleNewsBlock
                .replace("$CONTENT$", news[title].content)
                .replace(`$IMG_SRC$`, news[title].img)
                .replace("$NEWS_LINK$", news[title].link)
                .replace("$HEADING$", title);
              count++;
              if (count == 5) break;
            }
            body += `<a href='https://mailnews.onrender.com/news#${topic}' > <button style="background:#020617;font-size:14px; font-weight:600;color:white; padding:8px 15px; border-radius:99px;"> Read All ${topic} News </button></a> </div> <br>`;
          });
          body += `</body></html>`;
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
  if (slot == 48) {
    slot = 0;
  }
}

cron.schedule("*/30 * * * *", async()=>{await cronNews(); await emailCurrentSlot()});

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
app.listen(port || 10000, () => {
  console.log("SERVER RUNNING ON PORT " + port);
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
      res.status(404).render(__dirname + "/src/error.ejs", {
        title: "Account Not Found",
        message: `It seems like the account you are trying to access does not exist.`,
      });
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

app.get("/resetPass", (req, res) => {
  res.sendFile(__dirname + "/src/passwordReset.html");
});

app.post("/resetPass", (req, res) => {
  db.get("SELECT * FROM users WHERE emailID = ?", [req.body.email], (err, row) => {
    if(row){
      var tempPass = Math.random().toString(36).substring(2,9);
      db.run("UPDATE users SET password = ? WHERE emailID = ?", [crypto.createHash("sha256").update(tempPass).digest("hex"), req.body.email], (err) => {
        if(err){
          res.status(500).send("Some Error Occured");
        }
        else{
          mailer.sendMail({
            to: req.body.email,
            from: `MailNews ${process.env.EMAIL}`,
            subject: "Temporary Password | MailNews",
            html: tempPassMailBody.replace("TEMP_PASS", tempPass),
          }).catch((err) => {
            console.log(err);
          });
          res.status(200).send("Temporary Password Sent");
        }
      });
    }
    else{
      res.status(404).send("Account Not Found");
    }
  });
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
            if (row == undefined) {
              res.status(404).render(__dirname + "/src/error.ejs", {
                title: "Account Not Found",
                message: `It seems like the account you are trying to connect to does not exist.`,
              });
            } else {
              res.status(500).render(__dirname + "/src/error.ejs", {
                title: "Some Error Occured",
                message: `Some Error Occured in Server. Please Try Again Later. DETAILS : ${500} - auth-success`,
              });
            }
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
  if(req.session.loggedin){
    res.redirect("/dashboard");
    return;
  }
  res.sendFile(__dirname + "/src/signup.html");
});

app.get("/signin", (req, res) => {
  res.redirect("/login");
});
app.get("/login", (req, res) => {
  delete req.session.currentSubs;
  if(req.session.loggedin){
    res.redirect("/dashboard");
    return;
  }
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

app.post("/changePass", (req, res) => {
  if (req.session.loggedin) {
    db.get(
      `SELECT password FROM users WHERE emailID = "${req.session.loggedin}"`,
      (err, row) => {
        if (
          row.password ==
          crypto.createHash("sha256").update(req.body.oldPass).digest("hex")
        ) {
          db.run(
            `UPDATE users SET password = '${crypto
              .createHash("sha256")
              .update(req.body.newPass)
              .digest("hex")}' WHERE emailID = '${req.session.loggedin}'`,
            (err) => {
              if (err) {
                res.sendStatus(500);
              } else {
                res.sendStatus(200);
              }
            }
          );
        } else {
          res.status(400).send("Wrong Password");
        }
      }
    );
  } else {
    res.sendStatus(401).send("Not Logged In");
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.post("/deleteAccount", ensureAuthenticated, (req, res) => {
  if (req.session.loggedin) {
    db.run(
      `DELETE FROM users WHERE emailID = '${req.session.loggedin}'`,
      (err) => {
        if (err) {
          res.sendStatus(500);
        } else {
          req.logout(() => {
            res.sendStatus(200);
          });
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
  res.status(404).render(__dirname + "/src/error.ejs", {
    title: "Woops!! Are You Lost ?",
    message: `It seems like you are lost. Let's get you back on track.`,
  });
});
