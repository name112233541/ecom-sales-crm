# 2026-11-05 真实工作版 V1

## 已完成

- 移除自动模拟客户；真实空数据启动
- localStorage 存储键升级为 `ecom_crm_mvp_v2`
- 客户 CSV 导入（姓名/手机/微信/来源/产品/预算/状态/优先级/负责人/标签/下次跟进/备注）
- PWA manifest、service worker、安装入口
- 团队 Agent 工作台 `team.html`：角色、任务板、消息归档
- Windows 启动脚本 `launch-crm.bat`、`launch-team.bat`
- Pages 改为官方 Actions 部署流程
- 单文件版 `single.html` 自动重建

## 当前真实能力边界

- 单浏览器、单数据集，数据存 localStorage
- 无登录、无权限、无后端、无多人同步
- CSV 导入由浏览器本地处理
- 不做爬虫、自动私信、自动加人、非官方接口

## 访问

- 主应用：https://name112233541.github.io/ecom-sales-crm/
- 单文件：https://name112233541.github.io/ecom-sales-crm/single.html
- 团队：https://name112233541.github.io/ecom-sales-crm/team.html
- 备选渲染：https://raw.githack.com/name112233541/ecom-sales-crm/main/single.html
