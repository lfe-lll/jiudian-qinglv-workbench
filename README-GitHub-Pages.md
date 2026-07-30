# GitHub Pages 发布说明

这是“酒店与青旅经营工作台”的 GitHub Pages 部署包。

## 上传步骤

1. 打开 GitHub，新建一个仓库，例如：`hotel-operator-workbench`。
2. 进入仓库，点击 `Add file` → `Upload files`。
3. 把本文件夹里的所有内容上传到仓库根目录，包括：
   - `index.html`
   - `hotel-operator-workbench.html`
   - `manifest.json`
   - `sw.js`
   - `.nojekyll`
   - `assets` 文件夹
   - `_shared` 文件夹
4. 上传完成后，点击 `Commit changes`。
5. 进入仓库 `Settings` → `Pages`。
6. 在 `Build and deployment` 中选择：
   - Source：`Deploy from a branch`
   - Branch：`main`
   - Folder：`/root`
7. 保存后等待 1-3 分钟，GitHub 会生成一个访问网址。

## 手机添加到桌面

用手机浏览器打开 GitHub Pages 生成的网址。

安卓 Chrome：
1. 点击右上角菜单。
2. 选择“添加到主屏幕”或“安装应用”。
3. 桌面会出现“经营工作台”图标。

iPhone Safari：
1. 点击底部分享按钮。
2. 选择“添加到主屏幕”。
3. 点击“添加”。

## 注意

工作台的数据保存在当前浏览器本地。如果换手机或换浏览器，数据不会自动同步。建议定期在“更多 / 录入模板”页面点击“导出数据”备份。
