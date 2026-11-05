# 电商销售台 · Ecom Sales CRM

一个本地优先的电商客户跟进、订单和成交复盘工作台。

> 当前版本：真实空数据启动，不再自动生成模拟客户。

## 网址

- 主应用：https://name112233541.github.io/ecom-sales-crm/
- 单文件版：https://name112233541.github.io/ecom-sales-crm/single.html
- 团队工作台：https://name112233541.github.io/ecom-sales-crm/team.html

## 当前功能

- 客户管理：新增、编辑、删除、搜索、状态/来源筛选
- 客户 CSV 导入：支持按模板批量导入真实客户
- 跟进记录：沟通方式、内容、下次跟进日期
- 跟进队列：逾期、今天、未来 7 天
- 订单：待付款、已付款、已发货、已完成、已退款
- 工作台：客户数、待跟进、本月有效订单、本月成交额
- 销售漏斗：已触达、有意向、已报价、已成交
- 数据备份：JSON 导出/恢复、客户 CSV 导出
- PWA：支持安装到桌面/手机（浏览器支持时）
- 团队工作台：角色、任务板、团队消息归档（本地 V1）

## 第一次使用

1. 打开主应用。
2. 点击“导入 CSV”或“新增客户”。
3. 先用脱敏或测试数据走一遍：客户 → 跟进 → 订单。
4. 每天使用“导出 JSON 备份”。

## CSV 导入模板

表头：

```text
姓名,手机,微信,来源,意向产品,预算,状态,优先级,负责人,标签,下次跟进,备注
```

说明：

- `姓名` 必填；
- 状态可填：新线索、已联系、有意向、已报价、已成交、已流失；
- 优先级可填：高、中、低；
- 标签用逗号、中文逗号或顿号分隔；
- 下次跟进格式：`YYYY-MM-DD`。

也可以先导出一次空 CSV，拿到标准表头。

## 数据存储

- 数据保存在当前浏览器的 `localStorage`
- 键名：`ecom_crm_mvp_v2`
- 换浏览器、换设备、清缓存不会自动同步
- 重要数据请每天导出 JSON 备份

## 桌面启动

### 方式一：安装 PWA

用 Chrome/Edge 打开主应用，点侧边栏“安装到桌面”。如果浏览器没有显示该按钮，使用方式二。

### 方式二：Windows 启动脚本

下载 `launch-crm.bat`，放到桌面，双击即可用 Edge 应用模式打开。
团队工作台使用 `launch-team.bat`。

## 团队工作台

`team.html` 是本地团队任务板，记录：

- 5 个 Agent 角色及职责
- 任务状态：待办、进行中、待验收、已完成
- 团队消息归档

它不是实时多 Agent 运行时；真正的实时群聊和自动执行需要后端服务和模型 API。

## 当前边界

- 单浏览器、单数据集，无登录、权限、后端、多人同步
- 不适合直接存放未脱敏的敏感客户数据
- 不做抖音/企微非官方接口、爬虫、自动私信、批量加人
- 不承诺 GMV、转化率、成交率

## 开发

```text
index.html              主应用
styles.css              样式
app.js                  业务逻辑、localStorage、CSV 导入、PWA 注册
single.html             由 build-single.mjs 生成
manifest.webmanifest    PWA 配置
sw.js                   Service Worker
icon.svg                应用图标
team.html               Agent 工作台
launch-crm.bat          Windows 启动脚本
launch-team.bat         Windows 团队工作台启动脚本
```

检查：

```bash
node --check app.js
node tests/static-check.mjs
```
