import express from "express";
import fse from "fs-extra";
import path from "path";
import child_process from "child_process";
import { fileURLToPath } from "url";

// ESM 环境中获取 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 处理请求，返回 JSON 文件的数据
app.get("/data", async (req, res) => {
  const jsonFilePath = path.join(__dirname, "imageData.json");

  try {
    const data = await fse.readJson(jsonFilePath);
    res.json(data);
  } catch (err) {
    res.status(500).send("Error reading JSON file");
  }
});

app.get("/run-index", (req, res) => {
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
    console.log(`Process exited with code ${code}`);
    res.json({ status: "success", message: output });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
