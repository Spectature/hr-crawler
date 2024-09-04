import fse from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建或清空文件夹
export const createOrClearDirectory = (dirPath) => {
  // 清空或创建目录
  fse.emptyDirSync(dirPath);
};

// 递归遍历文件夹
export async function buildTree(dir) {
  const files = await fse.readdir(dir);
  const tree = {};

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fse.stat(fullPath);

    if (stat.isDirectory()) {
      // 递归调用构建子树
      tree[file] = await buildTree(fullPath);
    } else if (stat.isFile()) {
      // 如果是图片文件，放在叶子节点的数组中
      if (/\.(jpg|jpeg|png|gif)$/i.test(fullPath)) {
        if (!Array.isArray(tree)) {
          tree[file] = undefined;
        }

        tree[file] = fullPath
          .replace("imgs\\", "http:\\\\localhost:8080\\")
          .replace(/[<>：？"|?*\x00-\x1F]/g, "");
      }
    }
  }

  return tree;
}

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

export const compare = async () => {
  const originFilterPath = path.join(__dirname, "filter.json");
  const currentFilterPath = path.join(__dirname, "currentFilter.json");
  const selectedFilterPath = path.join(__dirname, "selectedFilterPath.json");
  const originFilter = await fse.readFile(originFilterPath, "utf8");
  const currentFilter = await fse.readFile(currentFilterPath, "utf8");
  const selectedFilter = await fse.readFile(selectedFilterPath, "utf8");
  const searchTypeResult = compareStringArrays(
    JSON.parse(originFilter).searchType,
    JSON.parse(currentFilter).searchType,
  );
  const companyResult = compareStringArrays(
    JSON.parse(originFilter).company,
    JSON.parse(currentFilter).company,
  );

  return {
    searchTypeResult: {
      add: getArrayIntersection(
        searchTypeResult.added,
        JSON.parse(selectedFilter.searchType),
      ),
      removed: searchTypeResult.removed,
    },
    companyResult,
  };
};

// 获取两个数组的交集
function getArrayIntersection(arr1, arr2) {
  // 将第一个数组转换为 Set
  const set1 = new Set(arr1);

  // 过滤第二个数组中的元素，保留那些在 set1 中存在的元素
  return arr2.filter((item) => set1.has(item));
}

export const dealFile = () => {};
