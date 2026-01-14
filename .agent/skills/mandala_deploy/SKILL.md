---
name: Mandala Distribution Sync
description: 自动化部署插件到 iCloud 同步目录，确保移动端能即时测试。
---

# Mandala Distribution Sync (发布同步专家)

本技能旨在简化“从开发构建到移动端验证”的流程。它通过自动化脚本将编译后的插件同步到 iCloud 驱动的 Obsidian 插件库。

## 1. 核心目标
- **快速验证**: 减少手动复制粘贴文件的繁琐。
- **环境一致性**: 确保 iCloud 目录中的插件版本始终是最新的。

## 2. 关键路径
- **源路径**: `/Users/panxiaorong/Documents/ObsidianPluginCode/MandalaGridViewV3codex/temp/vault/.obsidian/plugins/mandala-grid-dev`
- **目标路径**: `/Users/panxiaorong/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian/.obsidian/plugins/mandala-grid`

## 3. 使用方法
当你需要同步插件进行移动端测试时，请运行以下脚本：

```bash
./.agent/skills/mandala_deploy/scripts/deploy.sh
```

## 4. 注意事项
- **iCloud 同步延迟**: 文件复制后，iCloud 可能需要几秒到几分钟时间将更改推送到 iPhone/iPad。
- **Obsidian 重启**: 移动端 Obsidian 可能需要在设置中“重新加载”插件或重启应用才能看到新版本。
