const cheerio = require("cheerio");
const axios = require("axios");
const fileSystem = require("fs");
const node_summerizer = require("node-summarizer");
const puppeteer = require('puppeteer-extra');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
 
// // add stealth plugin and use defaults (all evasion techniques) 
// const StealthPlugin = require('puppeteer-extra-plugin-stealth') 
// puppeteer.use(StealthPlugin()) 

// async function getBrowserContent(url){
//  await puppeteer.launch({ headless: false}).then(async browser => { 
//     const page = await browser.newPage() 
// await page.setUserAgent("Mozilla/5.0 (compatible; MSIE 11.0; Windows NT 6.2; x64; en-US Trident/7.0)")
//     await page.goto(url)
//     await sleep(10000)
//     let $ =  (await page.content());
//     console.log($)
//     return $;
//   });
// }

let worldNewsURL = "https://www.ndtv.com/world-news";
let techNewsURL = "https://techcrunch.com/";
let scienceNewsURL = "https://www.nature.com/latest-news";
let businessNewsURL = "https://edition.cnn.com/business";
let sportsNewsURL = "https://www.reuters.com/sports/";
let entertainmentNewsURL = "https://www.wionews.com/entertainment";

user_agents = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 9_2_2) AppleWebKit/534.2 (KHTML, like Gecko) Chrome/47.0.2852.148 Safari/537",
  "Mozilla/5.0 (compatible; MSIE 11.0; Windows NT 6.2; x64; en-US Trident/7.0)",
];
const reqHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
};

async function getWorldNews() {
  let worldNewsData = {};
  let rawMainHTML = await axios.get(worldNewsURL);
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);

  const newsLinks = $(".newsHdng a").toArray();

  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(aLink.attribs["href"]);

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

    const Summerizer = new node_summerizer.SummarizerManager(body, 5);
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
  let rawMainHTML = await axios.get(techNewsURL);
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);
  const newsLinks = $(".wp-block-post-title a").toArray();

  for (const aLink of newsLinks) {
    console.log(aLink.attribs["data-destinationlink"])
    let rawArticleHTML = await axios.get(aLink.attribs["data-destinationlink"]);

    rawArticleHTML = rawArticleHTML.data;
    let articleHTML = cheerio.load(rawArticleHTML);
    console.log(articleHTML(".wp-block-post-title").length)
    let heading = (articleHTML(".wp-block-post-title").first()).text();
    
    console.log(heading)
    let img;
    try {
      img = articleHTML(".wp-block-post-featured-image img")[0]
        ? articleHTML(".wp-block-post-featured-image img")[0].attribs.src
        : cheerio.load(aLink.parent.parent)(".post-block__media img")[0].attribs
            .src;
    } catch (error) {
      img = null;
    }
    let body = "";
    articleHTML(".wp-block-paragraph").filter((index, ele) => {
      const classList = ele.attribs["class"] || '';
      return !(
        classList.includes("has-grey-500-color") ||
        classList.includes("has-xsmall-font-size")
      );
    }).each((index, para) => {

        const text = articleHTML(para).text();
        if (text !== null) {
          body += text;
        }
      }
    );
    const Summerizer = new node_summerizer.SummarizerManager(body, 5);
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
  let rawMainHTML = await axios.get(scienceNewsURL);
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);

  const newsLinks = $(".c-article-item__content.c-article-item--with-image a")
    .toArray()
    .slice(0, 10);
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://www.nature.com" + aLink.attribs["href"]
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

    const Summerizer = new node_summerizer.SummarizerManager(body, 5);
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
  let rawMainHTML = await axios.get(businessNewsURL)
  let $ = cheerio.load(rawMainHTML.data);
  const newsLinks = $(
    "a.container__link.container__link--type-article.container_lead-plus-headlines-with-images__link"
  ).toArray();
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://edition.cnn.com" + aLink.attribs["href"]
    );

    let articleHTML = cheerio.load(rawArticleHTML);
    let heading = articleHTML("h1.headline__text.inline-placeholder.vossi-headline-primary-core-light").text();

    let img = articleHTML("image__picture source")[0].attribs.srcset
console.log(img, heading)
    let body = "";
    articleHTML(
      ".text__text__1FZLe.text__dark-grey__3Ml43.text__regular__2N1Xr.text__small__1kGq2.body__full_width__ekUdw.body__small_body__2vQyf.article-body__paragraph__2-BtD"
    ).each((index, para) => {
      const text = articleHTML(para).text();

      if (text !== null) {
        body += text;
      }
    });

    const Summerizer = new node_summerizer.SummarizerManager(body, 5);
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
  let rawMainHTML = await axios.get(sportsNewsURL);
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
      "https://www.reuters.com" + aLink.attribs["href"]
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

    const Summerizer = new node_summerizer.SummarizerManager(body, 5);
    sportsNewsData[heading] = {
      img: img,
      link: "https://www.reuters.com" + aLink.attribs["href"],
      content: (await Summerizer.getSummaryByRank()).summary,
    };
  }

  fileSystem.writeFile(
    __dirname + "/sportNews.json",
    JSON.stringify(sportsNewsData),
    (error) => {}
  );
  console.log("GENERATED SPORTS NEWS");
}

async function getEntertainmentNews() {
  let entertainmentNewsData = {};
  let rawMainHTML = await axios.get(entertainmentNewsURL);
  rawMainHTML = rawMainHTML.data;
  let $ = cheerio.load(rawMainHTML);
  const newsLinks = $(".article-list-txt h2 a").toArray();
  // newsLinks.unshift($(
  //   "a.link__inherit-line-height__2qjXx"
  // ))
  for (const aLink of newsLinks) {
    let rawArticleHTML = await axios.get(
      "https://www.wionews.com" + aLink.attribs["href"]
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
    const Summerizer = new node_summerizer.SummarizerManager(body, 5);
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
  try {
    await Promise.all([
      getWorldNews(),
      getTechNews(),
      getScienceNews(),
      getBusinessNews(),
      getSportsNews(),
      getEntertainmentNews(),
    ]);
  } catch (error) {}
}

module.exports = { generateNewsFiles, getBusinessNews };
