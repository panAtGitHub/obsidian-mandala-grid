#!/bin/bash

# 定义路径
SOURCE="/Users/panxiaorong/Documents/ObsidianPluginCode/MandalaGridViewV3codex/temp/vault/.obsidian/plugins/mandala-grid-dev"
DEST="/Users/panxiaorong/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian/.obsidian/plugins/mandala-grid"

echo "🚀 开始同步插件到 iCloud 目录..."

# 检查源目录是否存在
if [ ! -d "$SOURCE" ]; then
    echo "❌ 错误: 源目录不存在: $SOURCE"
    exit 1
fi

# 创建目标目录（如果不存在）
mkdir -p "$DEST"

# 复制文件
# -r: 递归
# -v: 显示详情
# --delete: 删除目标目录中源目录没有的文件（如果使用 rsync）
# 这里我们简单使用 cp，因为 iCloud 目录比较敏感
cp -rv "$SOURCE/"* "$DEST/"

echo "✅ 同步完成！"
echo "源地址: $SOURCE"
echo "目标地址: $DEST"
