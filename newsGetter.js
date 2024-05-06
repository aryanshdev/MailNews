const cheerio = require("cheerio");
const axios = require("axios");
const fileSystem = require("fs");
const node_summerizer = require("node-summarizer");

let worldNewsURL = "https://www.ndtv.com/world-news";
let techNewsURL = "https://techcrunch.com/";
let scienceNewsURL = "https://www.nature.com/latest-news";
let businessNewsURL = "https://www.reuters.com/business/";
let sportsNewsURL = "https://www.reuters.com/sports/";
let entertainmentNewsURL = "https://www.wionews.com/entertainment";

const reqHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,/;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function getWorldNews() {
  let worldNewsData = {};
  let rawMainHTML = await axios.get(worldNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);

  const newsLinks = $(".newsHdng a").toArray();
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(aLink.attribs["href"], {
      headers: reqHeaders,
    });

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML("h1.sp-ttl").text();
    let img;
    try {
      img = articleHTML(".ins_instory_dv_cont img")["0"].attribs.src;
    } catch (error) {
      img = null;
    }
    let body = "";
    articleHTML(".sp-cn.ins_storybody p").each((index, para) => {
      const text = articleHTML(para).text();
      if (text !== null && text !== "Promoted") {
        body += text;
      }
    });

    const Summerizer = new node_summerizer.SummarizerManager(body, 4);
    worldNewsData[heading] = {
      img: img,
      link: aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/worldNews.json",
    JSON.stringify(worldNewsData),
    (error) => {}
  );
  console.log("GENERATED WORLD NEWS");
}

async function getTechNews() {
  let techNewsData = {};

  let rawMainHTML = await axios.get(techNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);

  const newsLinks = $(".post-block__title__link").toArray();
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(aLink.attribs["href"], {
      headers: reqHeaders,
    });

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML("h1.article__title").text();
    let img;
    try {
      img = articleHTML(".article__featured-image")[0]
        ? articleHTML(".article__featured-image")[0].attribs.src
        : cheerio.load(aLink.parent.parent)(".post-block__media img")[0].attribs
            .src;
    } catch (error) {
      img = null;
    }
    let body = "";
    articleHTML(".article-content p").each((index, para) => {
      const text = articleHTML(para).text();
      if (text !== null) {
        body += text;
      }
    });

    const Summerizer = new node_summerizer.SummarizerManager(body, 4);
    techNewsData[heading] = {
      img: img,
      link: aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/techNews.json",
    JSON.stringify(techNewsData),
    (error) => {}
  );
  console.log("GENERATED TECH NEWS");
}

async function getScienceNews() {
  let scienceNewsData = {};
  let rawMainHTML = await axios.get(scienceNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);

  const newsLinks = $(".c-article-item__content.c-article-item--with-image a")
    .toArray()
    .slice(0, 10);
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://www.nature.com" + aLink.attribs["href"],
      {
        headers: reqHeaders,
      }
    );

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML("h1.c-article-magazine-title").text();
    let img = articleHTML("figure.figure picture img")["0"]
      ? "https:" + articleHTML("figure.figure picture img")["0"].attribs.src
      : null; // articleHTML(".ytp-cued-thumbnail-overlay-image")[0].attribs.style.match(/https?:\/\/[^\\s]+/)[0];
    let body = "";
    articleHTML(".c-article-body.main-content p").each((index, para) => {
      const text = articleHTML(para).text();
      if (text !== null) {
        body += text;
      }
    });

    const Summerizer = new node_summerizer.SummarizerManager(body, 4);
    scienceNewsData[heading] = {
      img: img,
      link: "https://www.nature.com" + aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/scienceNews.json",
    JSON.stringify(scienceNewsData),
    (error) => {}
  );

  console.log("GENERATED SCIENCE NEWS");
}

async function getBusinessNews() {
  let businessNewsData = {};
  let rawMainHTML = await axios.get(businessNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);
  const newsLinks = $(
    "a.text__text__1FZLe.text__dark-grey__3Ml43.text__heading_6__1qUJ5"
  ).toArray();
  // newsLinks.unshift($(
  //   "a.link__inherit-line-height__2qjXx"
  // ))
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://www.reuters.com" + aLink.attribs["href"],
      {
        headers: reqHeaders,
      }
    );

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML("h1.text__text__1FZLe").text();

    let img = articleHTML("div.styles__fill__3xCr1 img")["0"]
      ? articleHTML("div.styles__fill__3xCr1 img")["0"].attribs.src
      : null;
    let body = "";
    articleHTML(
      ".text__text__1FZLe.text__dark-grey__3Ml43.text__regular__2N1Xr.text__small__1kGq2.body__full_width__ekUdw.body__small_body__2vQyf.article-body__paragraph__2-BtD"
    ).each((index, para) => {
      const text = articleHTML(para).text();

      if (text !== null) {
        body += text;
      }
    });

    const Summerizer = new node_summerizer.SummarizerManager(body, 4);
    businessNewsData[heading] = {
      img: img,
      link: "https://www.reuters.com" + aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/businessNews.json",
    JSON.stringify(businessNewsData),
    (error) => {}
  );

  console.log("GENERATED BUSINESS NEWS");
}

async function getSportsNews() {
  let sportsNewsData = {};
  let rawMainHTML = await axios.get(sportsNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);
  const newsLinks = $(
    "a.text__text__1FZLe.text__dark-grey__3Ml43.text__heading_6__1qUJ5"
  ).toArray();
  // newsLinks.unshift($(
  //   "a.link__inherit-line-height__2qjXx"
  // ))
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://www.reuters.com" + aLink.attribs["href"],
      {
        headers: reqHeaders,
      }
    );

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML("h1.text__text__1FZLe").text();
    let img = articleHTML("div.styles__fill__3xCr1 img")["0"]
      ? articleHTML("div.styles__fill__3xCr1 img")["0"].attribs.src
      : null; // articleHTML(".ytp-cued-thumbnail-overlay-image")[0].attribs.style.match(/https?:\/\/[^\\s]+/)[0];
    let body = "";
    articleHTML(
      ".text__text__1FZLe.text__dark-grey__3Ml43.text__regular__2N1Xr.text__small__1kGq2.body__full_width__ekUdw.body__small_body__2vQyf.article-body__paragraph__2-BtD"
    ).each((index, para) => {
      const text = articleHTML(para).text();

      if (text !== null) {
        body += text;
      }
    });

    const Summerizer = new node_summerizer.SummarizerManager(body, 4);
    sportsNewsData[heading] = {
      img: img,
      link: "https://www.reuters.com" + aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/sportsNews.json",
    JSON.stringify(sportsNewsData),
    (error) => {}
  );
  console.log("GENERATED SPORTS NEWS");
}

async function getEntertainmentNews() {
  let entertainmentNewsData = {};
  let rawMainHTML = await axios.get(entertainmentNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);
  const newsLinks = $(".article-list-txt h2 a").toArray();
  // newsLinks.unshift($(
  //   "a.link__inherit-line-height__2qjXx"
  // ))
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://www.wionews.com" + aLink.attribs["href"],
      {
        headers: reqHeaders,
      }
    );

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML(".article-heading h1").text();
    let img = articleHTML(".article-main-img span img.img-fluid")[0].attribs
      .src;
    let body = "";
    articleHTML(".article-main-data div p").each((index, para) => {
      let text = null;
      if (!articleHTML(para).html().startsWith("<")) {
        text = articleHTML(para).text();
      }

      if (text !== null) {
        body += text;
      }
    });
    const Summerizer = new node_summerizer.SummarizerManager(body, 4);
    entertainmentNewsData[heading] = {
      img: img,
      link: "https://www.wionews.com" + aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/entertainmentNews.json",
    JSON.stringify(entertainmentNewsData),
    (error) => {}
  );

  console.log("GENERATED ENTERTAINMENT NEWS");
}

async function generateNewsFiles() {
  await Promise.all([
    getBusinessNews(),
    getSportsNews(),
    getEntertainmentNews(),
    getWorldNews(), 
    getTechNews(),
    getScienceNews()]);
}

module.exports = { generateNewsFiles };
