const cheerio = require("cheerio");
const axios = require("axios");
const fileSystem = require("fs");
const node_summerizer = require("node-summarizer");
const { workerData } = require("worker_threads");

let worldNewsURLs = "https://www.ndtv.com/world-news";
let techNewsURLs = "https://www.gadgets360.com/news";
let scienceNewsURL = "https://www.nature.com/latest-news";

const reqHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,/;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

let techNewsData = {};

async function getWorldNews() {
  let worldNewsData = {};
  let rawMainHTML = await axios.get(worldNewsURLs, {
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
    let img = articleHTML(".ins_instory_dv_cont img")["0"].attribs.src;
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
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/worldNews.json",
    JSON.stringify(worldNewsData),
    (error) => {}
  );
}

async function getTechNews() {
  let rawMainHTML = await axios.get(worldNewsURLs, {
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
    let img = articleHTML(".ins_instory_dv_cont img")["0"].attribs.src;
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
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/worldNews.json",
    JSON.stringify(worldNewsData),
    (error) => {}
  );
}

async function getScienceNews() {
  let scienceNewsData = {};
  let rawMainHTML = await axios.get(scienceNewsURL, {
    headers: reqHeaders,
  });
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);

  const newsLinks = $(
    ".c-article-item__content.c-article-item--with-image a"
  ).toArray().slice(0,8);
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
      ? "https://www.nature.com" +
        articleHTML("figure.figure picture img")["0"].attribs.src
      : null; //articleHTML(".ytp-cued-thumbnail-overlay-image").attribs.style.match(/https?:\/\/[^\\s]+/[0]; 
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
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/scienceNews.json",
    JSON.stringify(scienceNewsData),
    (error) => {}
  );
}

async function generateNewsFiles() {
  await Promise.all([getWorldNews(), getTechNews(), getScienceNews()]);
}

module.exports = { getScienceNews };
