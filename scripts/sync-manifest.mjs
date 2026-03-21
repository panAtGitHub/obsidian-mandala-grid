import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// 取当前仓库根目录的绝对路径。
// 这里使用 `resolve('.')`，意思是“把当前执行命令所在的位置，转换成绝对路径”。
const repoRoot = resolve('.');

// 构造源文件路径：
// 仓库根目录下真正维护的插件清单文件 `manifest.json`。
const source = resolve(repoRoot, 'manifest.json');

// 构造目标目录路径：
// 开发构建产物会被放到 `temp/vault/.obsidian/plugins/mandala-grid-dev/`，
// 这个目录会被当作 Obsidian 的插件目录来加载。
const targetDir = resolve(
    repoRoot,
    'temp/vault/.obsidian/plugins/mandala-grid-dev'
);

// 构造目标文件路径：
// 也就是把 `manifest.json` 复制到开发插件目录后的最终位置。
const target = resolve(targetDir, 'manifest.json');

// 执行复制。
// 这一步的意义是：
// 代码和样式虽然会被构建到开发插件目录里，
// 但 `manifest.json` 不是打包器自动生成的，
// 所以这里需要手动同步一份过去，否则 Obsidian 无法把它识别成完整插件。
await copyFile(source, target);
