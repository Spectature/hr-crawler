import fse from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const originFilterPath = path.join(__dirname, "filter.json");
const currentFilterPath = path.join(__dirname, "currentFilter.json");
const originFilter = await fse.readJson(originFilterPath);
const currentFilter = await fse.readJson(currentFilterPath);

// 创建或清空文件夹
export const createOrClearDirectory = (dirPath) => {
  // 清空或创建目录
  fse.emptyDirSync(dirPath);
};

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

// 增量更新newsArr文件
export const dealFile = async (path, compareRes, updateNewsArr) => {
  try {
    // 读取文件
    const jsonData = await fse.readJson(path);
    const tempSet = new Set(jsonData);
    // 处理新增
    compareRes.searchTypeResult.added.forEach((item) => {
      const newObj = {
        type: item,
        news: [],
      };
      tempSet.add(newObj); // 添加到 Set 中
    });

    tempSet.forEach((item) => {
      if (compareRes.searchTypeResult.added.includes(item.type)) {
        //新增的搜索类型需要全量添加子公司
        compareRes.currentFilter.company.forEach((childrenItem) => {
          item.news.push({
            company: childrenItem,
            news: [],
          });
        });
      } else {
        //非新增搜索类型只需要增量添加
        compareRes.companyResult.added.forEach((childrenItem) => {
          item.news.push({
            company: childrenItem,
            news: [],
          });
        });
      }
    });

    // 处理删除
    compareRes.searchTypeResult.removed.forEach((item) => {
      tempSet.forEach((tempItem) => {
        if (tempItem.type === item) {
          tempSet.delete(tempItem);
        }
      });
    });

    tempSet.forEach((item) => {
      item.news = item.news.filter((item) => {
        return !compareRes.companyResult.removed.includes(item.company);
      });
    });

    // 处理更新
    const temArr = Array.from(tempSet);
    updateNewsByTypeAndCompany(temArr, updateNewsArr);
    // 写入文件
    await fse.writeJson(path, temArr, { spaces: 2 });
    console.log("File has been updated");
  } catch (err) {
    console.error("Error:", err);
  }
};

//覆盖filter文件

export const updateFilter = async () => {
  await fse.writeJson(originFilterPath, currentFilter, { spaces: 2 });
};
