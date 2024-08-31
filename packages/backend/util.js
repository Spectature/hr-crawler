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
