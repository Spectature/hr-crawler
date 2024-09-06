import { parentPort } from "worker_threads";
import fse from "fs-extra";
import sharp from "sharp";
import fs from "fs";
import { chromium } from "playwright";

// 设置最大加载时间
const maxLoadTime = 5000; // 5秒

const browser = await chromium.launch({
  headless: true, // false为显示浏览器，true为不显示浏览器
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // 替换为你本地的 Chromium 路径
});
const page = await browser.newPage();

// 子线程逻辑
parentPort.on("message", async (message) => {
  console.log("子线程收到主线程消息:", message);
  const { item, childrenItem } = message;
  for (const newsItem of childrenItem.news) {
    //需要替换掉所有特殊字符，不然无法重命名
    const inputPath = `imgs/${item.type}/${childrenItem.company}/${newsItem.id}&${newsItem.title.replace(/[\s<>:：？、%"|?*\x00-\x1F]/g, "")}.jpg`;
    const tempPath = `imgs/${item.type}/${childrenItem.company}/temp.jpg`;
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

  // 发送结果回主线程
  parentPort.postMessage("done");
});
