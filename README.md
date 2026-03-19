# 🔒 SecureData Mask — AI-Powered Excel Anonymizer

> **HR 数据脱敏专家** — 一款专为 HR 从业者打造的浏览器端 Excel 数据脱敏工具

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)

---

## 这是什么？

SecureData Mask 是一款 **纯浏览器端运行** 的 Excel 数据脱敏工具。当你需要将包含员工敏感信息（姓名、身份证号、薪资、手机号等）的 Excel 表格分享给外部协作方时，这个工具可以 **一键将敏感数据替换为不可识别的脱敏值**，同时保留数据的分析价值。

> 🔒 **所有数据仅在你的浏览器中本地处理，绝不上传任何服务器。**

---

## ✨ 核心功能

### 🚀 一键智能脱敏

上传 Excel 后，系统会 **自动识别 HR 敏感字段**（基于列名），并匹配最合适的脱敏方式：

| 字段类型 | 示例列名 | 脱敏效果 |
|---------|---------|---------|
| 姓名 | 姓名、员工姓名、中文名 | 张三 → 员工1 |
| 部门/组织 | 部门、组织、团队、中心 | 技术研发部 → 部门A |
| 身份证号 | 身份证、身份证号 | 110101199001011234 → 110\*\*\*\*\*\*\*\*\*\*\*1234 |
| 手机号 | 手机、电话、联系方式 | 13812345678 → 138\*\*\*\*5678 |
| 银行卡号 | 银行卡、账号 | 6222021234567890 → \*\*\*\*\*\*\*\*\*\*\*\*7890 |
| 薪资/金额 | 薪资、工资、年薪、奖金 | 25000 → 随机区间值 |
| 绩效等级 | 绩效、绩效等级、考核结果 | Outstanding → 等级打乱映射 |
| 九宫格/梯队 | 九宫格、人才梯队、继任 | 高潜力 → 等级打乱映射 |
| 邮箱 | 邮箱、email | zhang@company.com → user1@company.com |

一键完成后，你还可以 **逐列微调** — 更换脱敏方式，或取消某些列的脱敏。

### 📂 脱敏线程（Thread）管理

每次脱敏操作会自动生成一条 **脱敏线程记录**，保存原始数据、脱敏配置和映射关系：

- ✅ 关闭浏览器后数据不会丢失（自动保存在本地）
- ✅ 可以随时回看历史脱敏记录
- ✅ 可以导出映射文件（JSON）作为备份
- ✅ 可以在其他电脑上导入映射文件恢复

### 🔄 反向重塑（数据回流还原）

**最独特的能力** — 把脱敏后的 Excel 发给外部团队，他们在上面新增评估结果、打分、建议等列后返回给你。系统自动将脱敏值还原为真实值，同时保留新增的数据列。

| 脱敏后发出 | 外部返回 | 反向重塑后 |
|-----------|---------|-----------|
| 员工1 | 员工1 → 绩效建议：优秀 | **张三** → 绩效建议：优秀 |
| 员工2 | 员工2 → 绩效建议：良好 | **李四** → 绩效建议：良好 |
| 部门A | 部门A | **技术研发部** |

---

## 🎯 典型使用场景

| 场景 | 说明 |
|------|------|
| **外部顾问盘点** | 将人员信息脱敏后提供给管理咨询顾问，完成后反向重塑还原 |
| **绩效校准** | 隐去人员身份进行跨部门评审校准，完成后还原落地 |
| **培训需求分析** | 将能力评估数据脱敏后提供给培训供应商分析，完成后还原 |

---

## 🛡️ 安全保障

| 保障项 | 说明 |
|-------|------|
| 🔒 纯本地运行 | 所有数据处理在你的浏览器中完成，不经过任何服务器 |
| 🚫 零网络依赖 | 首次加载后，工具无需网络即可使用 |
| 💾 本地存储 | 脱敏记录保存在浏览器 LocalStorage 中 |
| 🗑️ 随时清除 | 你可以随时删除任何脱敏记录 |

---

## 🚀 快速开始

### 在线使用

直接打开 `standalone.html` 或 `SecureDataMask_Offline.html` 文件即可使用，无需安装任何依赖。

### 本地开发

**前置要求：** Node.js 18+

```bash
# 克隆仓库
git clone https://github.com/hansluo/HR-data-Mask.git
cd HR-data-Mask

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 🏗️ 技术架构

```
├── components/          # UI 组件
│   ├── Header.tsx       # 顶部导航栏
│   ├── ThreadList.tsx   # 脱敏线程列表
│   ├── FileUploader.tsx # 文件上传组件
│   ├── ConfigPanel.tsx  # 脱敏配置面板
│   ├── PreviewTable.tsx # 实时预览表格
│   └── ReshapePanel.tsx # 反向重塑面板
├── context/             # React Context 状态管理
├── services/            # 脱敏算法核心逻辑
├── App.tsx              # 应用入口
├── types.ts             # TypeScript 类型定义
└── standalone.html      # 单文件离线版本
```

**技术栈：**
- **React 19** + **TypeScript 5.8** — 类型安全的 UI 开发
- **Vite 6** — 极速开发与构建
- **SheetJS (xlsx)** — Excel 文件读写
- **Tailwind CSS** — 原子化样式
- **LocalStorage** — 本地数据持久化

---

## 📄 License

MIT License — 详见 [LICENSE](LICENSE) 文件
