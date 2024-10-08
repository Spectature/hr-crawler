import fse from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const originFilterPath = path.join(__dirname, "filter.json");
const currentFilterPath = path.join(__dirname, "currentFilter.json");
const imgsPath = path.join(__dirname, "/imgs");
const originFilter = await fse.readJson(originFilterPath);
const currentFilter = await fse.readJson(currentFilterPath);

let globalUpdateProgressFunc;

// 对比两个字符串数组
export function compareStringArrays(template, target) {
  const result = {
    added: [],
    removed: [],
  };

  // 转换为集合
  const templateSet = new Set(template);
  const targetSet = new Set(target);

  // 检查新增项
  target.forEach((item) => {
    if (!templateSet.has(item)) {
      result.added.push(item);
    }
  });

  // 检查删除项
  template.forEach((item) => {
    if (!targetSet.has(item)) {
      result.removed.push(item);
    }
  });

  return result;
}

let globalPage;
const workers = [];
const createSubThread = (
  item,
  childrenItem,
  index,
  workersDoneCount,
  updateNewsArr,
) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js"); // 每个worker运行同一个子线程文件
    let progress;
    // 接收子线程发回的数据
    worker.on("message", (message) => {
      if (message === "onceDone") {
        workersDoneCount.value++;
        progress =
          10 +
          (workersDoneCount.value * 85) /
            updateNewsArr.length /
            item.news.length /
            10;
        globalUpdateProgressFunc(progress);
      } else if (message === "done") {
        console.log("Worker${index} 完成任务,当前进度:", progress);
        resolve(message); // 当 worker 完成任务时，resolve Promise
      }
    });

    // 捕获子线程中的错误
    worker.on("error", (error) => {
      console.error(`子线程 ${index} 错误:`, error);
      reject(error); // 如果 worker 出现错误，reject Promise
    });

    // 捕获子线程退出事件
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker 退出码不为 0: ${code}`));
      }
    });

    // 发送消息给子线程
    worker.postMessage({
      item,
      childrenItem,
    });
  });
};

const workersDoneCount = {
  value: 0,
};

const updateImgs = async (updateNewsArr) => {
  updateNewsArr.forEach((item) => {
    item.news.forEach((childrenItem, index) => {
      workers.push(
        createSubThread(
          item,
          childrenItem,
          index,
          workersDoneCount,
          updateNewsArr,
        ),
      );
    });
  });

  try {
    // 等待所有 worker 完成
    const results = await Promise.all(workers);
    console.log("所有 Worker 已完成:", results);
  } catch (error) {
    console.error("有 Worker 失败:", error);
  }
};

// 增量更新数组数据
function updateNewsByTypeAndCompany(fullArray, partArray) {
  partArray.forEach((partItem) => {
    // 找到与 partItem.type 匹配的对象
    const fullItem = fullArray.find((fItem) => fItem.type === partItem.type);

    if (fullItem && Array.isArray(fullItem.news)) {
      // 遍历 partItem 中的 news 列表
      partItem.news.forEach((partNewsItem) => {
        // 在 fullItem.news 中查找匹配的 company
        const newsItem = fullItem.news.find(
          (nItem) => nItem.company === partNewsItem.company,
        );

        if (newsItem) {
          // 找到对应的 company，更新 news 字段
          newsItem.news = partNewsItem.news;
        } else {
          // 如果找不到对应的 company，可以选择插入新数据
          fullItem.news.push(partNewsItem);
        }
      });
    }
  });
}

// 对比filter和currentFilter区别
export const compare = async () => {
  const searchTypeResult = compareStringArrays(
    originFilter.searchType,
    currentFilter.searchType,
  );
  const companyResult = compareStringArrays(
    originFilter.company,
    currentFilter.company,
  );

  return {
    searchTypeResult,
    companyResult,
    currentFilter,
  };
};

//  主入口 增量更新newsArr文件和imgs文件夹
export const dealFile = async (
  newsArrPath,
  compareRes,
  updateNewsArr,
  page,
  updateProgress,
) => {
  globalPage = page;
  globalUpdateProgressFunc = updateProgress;
  try {
    // 读取文件
    const jsonData = await fse.readJson(newsArrPath);
    const tempSet = new Set(jsonData);
    // 处理新增
    compareRes.searchTypeResult.added.forEach((item) => {
      const newObj = {
        type: item,
        news: [],
      };
      tempSet.add(newObj); // 添加到 Set 中
      fse.mkdirsSync(path.join(imgsPath, item));
    });

    tempSet.forEach((item) => {
      if (compareRes.searchTypeResult.added.includes(item.type)) {
        //新增的搜索类型需要全量添加子公司
        compareRes.currentFilter.company.forEach((childrenItem) => {
          item.news.push({
            company: childrenItem,
            news: [],
          });
          fse.mkdirsSync(path.join(imgsPath, item.type, childrenItem));
        });
      } else {
        //非新增搜索类型只需要增量添加
        compareRes.companyResult.added.forEach((childrenItem) => {
          item.news.push({
            company: childrenItem,
            news: [],
          });
          fse.mkdirsSync(path.join(imgsPath, item.type, childrenItem));
        });
      }
    });

    // 处理删除
    compareRes.searchTypeResult.removed.forEach((item) => {
      tempSet.forEach((tempItem) => {
        if (tempItem.type === item) {
          tempSet.delete(tempItem);
          fse.removeSync(path.join(imgsPath, item));
        }
      });
    });

    tempSet.forEach((item) => {
      item.news.forEach((newsItem) => {
        if (compareRes.companyResult.removed.includes(newsItem.company)) {
          fse.removeSync(path.join(imgsPath, item.type, newsItem.company));
        }
      });
      item.news = item.news.filter((item) => {
        return !compareRes.companyResult.removed.includes(item.company);
      });
    });

    // 处理更新
    const temArr = Array.from(tempSet);
    updateNewsByTypeAndCompany(temArr, updateNewsArr);
    await updateImgs(updateNewsArr);
    // 写入文件
    await fse.writeJson(newsArrPath, temArr, { spaces: 2 });
    console.log("File has been updated");
  } catch (err) {
    console.error("Error:", err);
  }
};

//覆盖filter文件

export const updateFilter = async () => {
  await fse.writeJson(originFilterPath, currentFilter, { spaces: 2 });
};
