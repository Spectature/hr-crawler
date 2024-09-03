import { chromium } from "playwright";
import sharp from "sharp";
import fs from "fs";
import fse from "fs-extra";
import path from "path";
import { buildTree, createOrClearDirectory } from "./util.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { WebSocketServer } from "ws";
import express from "express";
import http from "http";

const searchTypeArr = ["裁员", "绩效季", "业务线调整"];

const companies = [
  "字节",
  "腾讯",
  "快手",
  "美团",
  "百度",
  "滴滴",
  "网易",
  "华为",
  "小红书",
  "拼多多",
  "bilibili",
  "虾皮",
  "360",
  "谷歌",
  "Meta",
  "京东",
  "虹软",
  "科大讯飞",
  "月之暗面",
  "minimax",
  "商汤",
  "旷视",
  "云从",
  "依图",
  "微软",
];
// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
// 获取当前文件所在的目录
const __dirname = dirname(__filename);

// #region ws部分逻辑
let wsData = {
  currentStage: "",
  progress: 0,
};
const app = express();
const port = 3001;
// 创建HTTP服务器
const server = http.createServer(app);
// 创建WebSocket服务器并附加到HTTP服务器上
const wss = new WebSocketServer({ server });

let wsInterval = null;

// 当有客户端连接时
wss.on("connection", (ws) => {
  console.log("Client connected");

  // 定时向客户端发送数据
  wsInterval = setInterval(() => {
    ws.send(JSON.stringify(wsData));
  }, 1000); // 每隔1秒发送一次数据

  // 当客户端断开连接时，清除定时器
  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(wsInterval);
  });
});

// 启动服务器
server.listen(port, () => {
  console.log(`WSServer is running on http://localhost:${port}`);
});

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const getNewsInfo = async (page, companies) => {
  let progress = 0;
  const typeNews = [];
  for (const searchType of searchTypeArr) {
    const companyNews = [];
    for (const item of companies) {
      progress++;
      wsData.progress = formatter.format(
        (progress * 10) / companies.length / searchTypeArr.length,
      );
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
          .slice(0, 11)
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
  let progress = 0;
  wsData.currentStage = "保存新闻图片";
  // 定义文件夹路径
  const imgsDir = path.join(__dirname, "imgs");
  createOrClearDirectory(imgsDir);
  console.log(newsArr);
  for (const item of newsArr) {
    const typeDir = path.join(imgsDir, item.type);
    fs.mkdirSync(typeDir);
    console.log("创建类型文件夹");
    for (const typeItem of item.news) {
      const companyDir = path.join(typeDir, typeItem.company);
      fs.mkdirSync(companyDir);
      console.log("创建子公司文件夹");
      for (const newsItem of typeItem.news) {
        progress++;
        wsData.progress = formatter.format(
          10 + (progress * 85) / companies.length / searchTypeArr.length / 10,
        );

        //需要替换掉所有特殊字符，不然无法重命名
        const inputPath = `imgs/${item.type}/${typeItem.company}/${newsItem.title.replace(/[\s<>:：？、%"|?*\x00-\x1F]/g, "")}.jpg`;
        const tempPath = `imgs/${item.type}/${typeItem.company}/temp.jpg`;
        // 设置最大加载时间
        const maxLoadTime = 5000; // 5秒
        try {
          await Promise.race([
            page.goto(newsItem.href),
            new Promise((_, reject) =>
              setTimeout(() => reject("Load Timeout"), maxLoadTime),
            ),
          ]);
        } catch (e) {
          console.log(e);
        }

        try {
          // 如果页面在指定时间内加载完成，继续执行截图
          await page.screenshot({
            path: inputPath,
            fullPage: true,
          });
        } catch (e) {
          console.log(e, inputPath);
        }

        const exists = await fse.pathExists(inputPath);

        if (exists) {
          try {
            await sharp(inputPath).jpeg({ quality: 50 }).toFile(tempPath);
            // 将临时文件重命名为原始文件，覆盖原始文件
            fs.renameSync(tempPath, inputPath);
          } catch (e) {
            console.log(e, inputPath);
          }
        }
      }
    }
  }
};

//  ai总结部分
const aiSummary = () => {
  axios
    .post(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      {
        model: "qwen2-1.5b-instruct",
        input: {
          prompt: `${searchTypeArr.join("、")},这是我需要你整理的话题${JSON.stringify(newsArr)}这是我整理的关于这些话题的数组，它里面有每个话题下各个公司的新闻，你访问一下这些新闻地址，然后给我总结一下，这些话题下的每个公司到底都发生了什么，按照话题类型1：公司1、公司2....：新闻总结，话题类型2：公司1、公司2....：新闻总结的方式去总结，每一个新闻总结的字数不少于100字。`,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-c2257034d2c8463999a9eea54da28683",
        },
      },
    )
    .then((res) => {
      console.log("ai", res.data.output);
    })
    .catch((err) => {
      console.log(err);
    });
};

const generateJSON = async () => {
  const dataFilePath = path.join(__dirname, "imageData.json");
  const imgPathArr = await buildTree("imgs");
  console.log(imgPathArr);
  await fse.writeJson(dataFilePath, imgPathArr, { spaces: 2 });
  wsData.progress = 100;
};

const loadNewsInfo = async (page, companies) => {
  wsData.currentStage = "搜索所有新闻信息";
  let newsArr;

  try {
    const dataFilePath = path.join(__dirname, "newsArr.json");
    const data = await fse.readFile(dataFilePath, "utf8");

    if (data) {
      // 解析 JSON 数据并返回
      newsArr = JSON.parse(data);
      wsData.progress = 10;
    } else {
      throw new Error("文件为空");
    }
  } catch (err) {
    console.error("读取文件失败或文件为空:", err);
    newsArr = await getNewsInfo(page, companies);
    const dataFilePath = path.join(__dirname, "newsArr.json");
    await fse.writeJson(dataFilePath, newsArr, { spaces: 2 });
  }

  return newsArr;
};

(async () => {
  const browser = await chromium.launch({
    headless: false, // false为显示浏览器，true为不显示浏览器
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // 替换为你本地的 Chromium 路径
  });
  const page = await browser.newPage();
  // 访问目标页面
  await page.goto("https://www.google.com");

  wsData.currentStage = "none";
  wsData.progress = 0;

  let newsArr;

  // newsArr = await loadNewsInfo(page, companies);
  // console.log(newsArr);

  // await saveNewsInfo(page, newsArr);
  //
  await generateJSON();

  console.log("数据更新完毕！");
  // 关闭浏览器
  await browser.close();
  clearInterval(wsInterval);
})();
