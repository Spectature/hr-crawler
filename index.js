import { chromium } from "playwright";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { createOrClearDirectory } from "./util.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const searchTypeArr = ["裁员", "绩效季", "业务线调整"];

const companies = ["IBM", "滴滴"];
// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前文件所在的目录
const __dirname = dirname(__filename);

const getNewsInfo = async (page, companies) => {
  const typeNews = [];
  for (const searchType of searchTypeArr) {
    const companyNews = [];
    for (const item of companies) {
      // 在搜索栏中输入“裁员”
      await page.fill('textarea[name="q"]', `${item} ${searchType}`);

      // 模拟按下 Enter 键以执行搜索
      await page.press('textarea[name="q"]', "Enter");

      // 等待搜索结果加载完毕
      await page.waitForLoadState("networkidle");

      // 提取前10条搜索结果的标题和链接
      const newsArr = await page.evaluate(() => {
        const news = Array.from(document.querySelectorAll("div.MjjYud"));
        return news
          .slice(0, 10)
          .map((newItem) => {
            return {
              title: newItem.querySelector("h3")?.innerText,
              href: newItem.querySelector('a[jsname="UWckNb"]')?.href,
            };
          })
          .filter(
            (item) => item.title !== undefined && item.href !== undefined,
          );
      });

      companyNews.push({
        company: item,
        news: newsArr,
      });
    }
    typeNews.push({
      type: searchType,
      news: companyNews,
    });
  }

  return typeNews;
};

const saveNewsInfo = async (page, newsArr) => {
  // 定义文件夹路径
  const imgsDir = path.join(__dirname, "imgs");
  createOrClearDirectory(imgsDir);
  console.log(newsArr);
  for (const item of newsArr) {
    const typeDir = path.join(imgsDir, item.type);
    fs.mkdirSync(typeDir);
    for (const typeItem of item.news) {
      const companyDir = path.join(imgsDir, typeItem.company);
      fs.mkdirSync(companyDir);
      for (const newsItem of typeItem.news) {
        const inputPath = `imgs/${item.type}/${typeItem.company}/${newsItem.title.replaceAll(".", "")}.jpg`;
        const tempPath = `imgs/${item.type}/${typeItem.company}/temp.jpg`;
        // 设置最大加载时间
        const maxLoadTime = 10000; // 10秒

        try {
          await Promise.race([
            page.goto(newsItem.href),
            new Promise((_, reject) =>
              setTimeout(() => reject("Load Timeout"), maxLoadTime),
            ),
          ]);

          // 如果页面在指定时间内加载完成，继续执行截图
          await page.screenshot({
            path: inputPath,
            fullPage: true,
          });
        } catch (error) {
          console.error(`Error loading page ${newsItem.href}: ${error}`);
          // 即使加载超时，也继续执行截图
          await page.screenshot({
            path: inputPath,
            fullPage: true,
          });
        }
        await sharp(inputPath).jpeg({ quality: 50 }).toFile(tempPath);
        // 将临时文件重命名为原始文件，覆盖原始文件
        fs.renameSync(tempPath, inputPath);
      }
    }
  }
};

(async () => {
  // 启动浏览器
  const browser = await chromium.launch({
    headless: true, // false为显示浏览器，true为不显示浏览器
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // 替换为你本地的 Chromium 路径
  });
  const page = await browser.newPage();

  // 访问目标页面
  await page.goto("https://www.google.com");

  const newsArr = await getNewsInfo(page, companies);
  // console.log(JSON.stringify(newsArr));
  // ai总结部分
  // axios
  //   .post(
  //     "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
  //     {
  //       model: "qwen2-1.5b-instruct",
  //       input: {
  //         prompt: `${searchTypeArr.join("、")},这是我需要你整理的话题${JSON.stringify(newsArr)}这是我整理的关于这些话题的数组，它里面有每个话题下各个公司的新闻，你访问一下这些新闻地址，然后给我总结一下，这些话题下的每个公司到底都发生了什么，按照话题类型1：公司1、公司2....：新闻总结，话题类型2：公司1、公司2....：新闻总结的方式去总结，每一个新闻总结的字数不少于100字。`,
  //       },
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: "Bearer sk-c2257034d2c8463999a9eea54da28683",
  //       },
  //     },
  //   )
  //   .then((res) => {
  //     console.log("ai", res.data.output);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  // console.log(newsArr);

  // 下面的需要继续调试，上面的数据没问题了
  await saveNewsInfo(page, newsArr);
  // 关闭浏览器
  await browser.close();
})();
