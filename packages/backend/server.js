import express from "express";
import fse from "fs-extra";
import path from "path";
import child_process from "child_process";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";

// ESM 环境中获取 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// 处理请求，返回图片文件的数据
app.get("/data", async (req, res) => {
  const jsonFilePath = path.join(__dirname, "imageData.json");

  try {
    const data = await fse.readJson(jsonFilePath);
    res.json(data);
  } catch (err) {
    res.status(500).send("Error reading JSON file");
  }
});

// 处理请求，返回搜索文件的数据
app.get("/searchData", async (req, res) => {
  const jsonFilePath = path.join(__dirname, "filter.json");

  try {
    const data = await fse.readJson(jsonFilePath);
    res.json(data);
  } catch (err) {
    res.status(500).send("Error reading JSON file");
  }
});

// 创建更新搜索文件的接口
app.post("/updateSearchData", async (req, res) => {
  const jsonFilePath = path.join(__dirname, "currentFilter.json");
  try {
    const newData = req.body; // 从请求体获取数据

    // 将更新后的内容写回到JSON文件
    await fse.writeJson(jsonFilePath, { ...newData }, { spaces: 2 });

    // 返回成功响应
    res.status(200).json({ message: "JSON file updated successfully!" });
  } catch (error) {
    // 处理错误
    console.error("Error updating JSON file:", error);
    res.status(500).json({ message: "Failed to update JSON file." });
  }
});

//刷新后端数据
app.post("/run-index", async (req, res) => {
  const jsonFilePath = path.join(__dirname, "selectedFilter.json");
  try {
    const newData = req.body; // 从请求体获取数据

    // 将更新后的内容写回到JSON文件
    await fse.writeJson(jsonFilePath, { ...newData }, { spaces: 2 });
  } catch (e) {
    console.log(e);
  }

  const process = child_process.spawn("node", ["index.js"]);
  let output = "";

  process.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`); // 打印标准输出到控制台
    output += data; // 收集数据
  });

  process.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`); // 打印错误输出到控制台
  });

  process.on("close", (code) => {
    console.log(`进程结束 ${code}`);
    res.json({ status: "success", message: output });
  });

  process.on("exit", (code) => {
    console.log(`子进程退出，退出码: ${code}`);
  });
});

// 获取当前数据时间
app.get("/currentActiveTime", async (req, res) => {
  const jsonFilePath = path.join(__dirname, "imageData.json");

  try {
    const stats = await fse.stat(jsonFilePath); // 使用 fs-extra 获取文件信息
    let lastModifiedTime = stats.mtime; // 获取文件创建时间
    console.log(lastModifiedTime);
    // 转换为东八区时间
    lastModifiedTime = DateTime.fromJSDate(lastModifiedTime, { zone: "UTC" })
      .setZone("UTC+8") // 或者 'UTC+8'
      .toFormat("yyyy-MM-dd HH:mm:ss");
    res.json({ lastModifiedTime });
    console.log(lastModifiedTime);
  } catch (err) {
    res
      .status(500)
      .json({ error: "File not found or error retrieving file stats" });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
