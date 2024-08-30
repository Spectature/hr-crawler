import fse from "fs-extra";

// 创建或清空文件夹
export const createOrClearDirectory = (dirPath) => {
  // 清空或创建目录
  fse.emptyDirSync(dirPath);
};
