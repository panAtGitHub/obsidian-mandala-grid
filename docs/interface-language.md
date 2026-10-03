# 界面语言 / Interface language

在 **Obsidian 设置 → Mandala Grid → 界面语言** 中选择：

-   **跟随 Obsidian**（默认）：中文 Obsidian 使用中文，其余语言使用英文。
-   **简体中文**：固定使用中文。
-   **English**：固定使用英文。

选择后立即保存到当前库的插件设置，并更新插件设置页和命令名称。重新加载 Mandala Grid 插件后，已打开的菜单和视图会使用新语言。

语言选择适用于桌面和移动端。已有笔记正文、用户填写的标题、布局名称、模板、日期标题格式以及 YAML 字段不因界面语言改变。要让日计划日期标题使用英文星期，请单独选择对应的日期标题格式。

英文覆盖设置面板、当前文件设置、布局与模板弹窗、导出菜单、快捷键、主要工具栏、搜索、预览以及操作提示。Issue #2 中的 Android 问题未提供复现步骤；本次实现英文界面，不代表已定位其设备问题。

## English

Open **Settings → Mandala Grid → Interface language** and choose **Follow Obsidian**, **简体中文**, or **English**. The preference is saved in this vault's plugin settings. Reload the plugin to update menus and views that were already open.

Changing the interface language preserves note content, user headings, templates, layout names and YAML keys. Date heading formats are configured separately.

## 维护说明

-   `src/lang/interface-language.ts`：语言选择及 Obsidian 版本兼容。
-   `src/lang/chinese-messages.ts`：保留原有 `lang` 的字段与函数接口。
-   `src/lang/english-messages.ts`：中文原文作为稳定键，集中管理英文翻译。
-   `tx(message, ...values)`：先选择文案，再替换 `{0}` 等位置参数；参数本身不翻译、不作为 HTML 执行。未登记文案回退到原文。
-   快捷键和工具栏的缓存标签在读取时解析语言；快捷键分组标识保持稳定，只翻译显示名称。
-   检查范围：语言与设置迁移测试、设置下拉框渲染、受影响的编辑器/导出/导航测试，以及修改文件的格式化和 Lint。完整检查在正式发布前执行。
