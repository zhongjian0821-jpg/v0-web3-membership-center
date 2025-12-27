# GitHub 代码仓库部署完整指南

## 📦 项目概述

本指南将帮助你将以下内容上传到GitHub：
1. 前端Next.js项目（当前项目）
2. 数据库Schema和迁移脚本
3. API文档和配置文件

---

## 方法1：使用v0内置的GitHub集成（推荐）⭐

### 步骤1：连接GitHub仓库

1. **在v0界面左侧边栏**，点击 **"Settings"** 或 **齿轮图标**
2. 找到 **"GitHub Repository"** 部分
3. 点击 **"Connect GitHub"** 或 **"Link Repository"**
4. 选择：
   - **创建新仓库**：输入仓库名称（如 `web3-membership-frontend`）
   - **连接现有仓库**：选择已有的GitHub仓库

### 步骤2：自动同步代码

连接后，v0会自动：
- ✅ 创建GitHub仓库（如果选择新建）
- ✅ 将所有前端代码推送到GitHub
- ✅ 每次代码更新时自动同步
- ✅ 生成README.md和.gitignore

### 步骤3：添加数据库Schema文件

 会自动包含以下数据库相关文件：
- `database/schema.sql` - 完整的表结构
- `database/migrations/` - 迁移脚本
- `.env.example` - 环境变量模板

---

## 方法2：手动创建GitHub仓库

如果v0不支持自动同步，使用这个方法：

### 步骤1：下载项目代码

1. 点击v0界面右上角 **⋮（三个点）**
2. 选择 **"Download ZIP"**
3. 解压到本地文件夹

### 步骤2：初始化Git仓库

打开终端，进入项目目录：

```bash
cd web3-membership-frontend

# 初始化Git仓库
git init

# 添加所有文件
git add .

# 第一次提交
git commit -m "Initial commit: Web3 Membership Center Frontend"
```

### 步骤3：创建GitHub仓库并推送

```bash
# 在GitHub上创建新仓库后，获取仓库URL
# 例如：https://github.com/yourusername/web3-membership-frontend.git

# 添加远程仓库
git remote add origin https://github.com/yourusername/web3-membership-frontend.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

---

## 📊 数据库导出到GitHub

### 方法1：导出完整Schema（推荐）

我已经为你准备了完整的数据库导出文件。在项目中包含：

```
database/
├── schema.sql                    # 完整的建表语句
├── seed-data.sql                # 初始数据（可选）
├── migrations/
│   ├── 001_create_wallets.sql
│   ├── 002_create_nodes.sql
│   ├── 003_create_hierarchy.sql
│   └── ...
└── README.md                    # 数据库使用说明
```

### 方法2：使用Neon CLI导出

如果需要包含现有数据：

```bash
# 安装Neon CLI
npm install -g neonctl

# 登录
neonctl auth

# 导出数据库
neonctl db-dump --project-id <your-project-id> > database/backup.sql
```

---

## 🗂️ 推荐的GitHub仓库结构

```
web3-membership-frontend/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions自动部署
├── app/                         # Next.js应用代码
├── components/                  # React组件
├── lib/                         # 工具函数和API客户端
├── database/                    # 数据库文件
│   ├── schema.sql
│   ├── migrations/
│   └── README.md
├── docs/                        # 文档
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── ARCHITECTURE.md
├── public/                      # 静态资源
├── .env.example                 # 环境变量模板
├── .gitignore
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md                    # 项目说明
```

---

## 📝 需要在GitHub上传的文件清单

### 前端代码 ✅
- [x] app/ - 所有页面和路由
- [x] components/ - UI组件
- [x] lib/ - API客户端和工具函数
- [x] public/ - 图片和静态资源
- [x] package.json - 依赖配置
- [x] next.config.js - Next.js配置
- [x] tsconfig.json - TypeScript配置
- [x] tailwind.config.ts - Tailwind配置
- [x] .env.example - 环境变量模板

### 数据库文件 ✅
- [x] database/schema.sql - 完整建表语句
- [x] database/migrations/ - 迁移脚本
- [x] database/README.md - 数据库说明

### 文档 ✅
- [x] README.md - 项目说明
- [x] FRONTEND_API_DOCUMENTATION.md - API文档
- [x] WALLET_LOGIN_API_REPLACEMENT_GUIDE.md - 登录API替换指南
- [x] DEPLOYMENT_CHECKLIST.md - 部署检查清单

### 配置文件 ✅
- [x] .gitignore - Git忽略规则
- [x] .env.example - 环境变量模板

---

## 🚀 自动部署配置（GitHub Actions）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
          NEXT_PUBLIC_BACKEND_API_URL: \${{ secrets.NEXT_PUBLIC_BACKEND_API_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
```

---

## 🔐 GitHub Secrets配置

在GitHub仓库设置中添加以下Secrets：

1. 进入仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **"New repository secret"**
3. 添加以下Secrets：

| Secret名称 | 值 | 用途 |
|-----------|---|------|
| `DATABASE_URL` | Neon数据库连接URL | 数据库连接 |
| `NEXT_PUBLIC_BACKEND_API_URL` | 后端API地址 | API调用 |
| `VERCEL_TOKEN` | Vercel部署Token | 自动部署 |
| `ORG_ID` | Vercel组织ID | 部署配置 |
| `PROJECT_ID` | Vercel项目ID | 部署配置 |

---

## 📄 完整的README.md模板

```markdown
# Web3 Membership Center - Frontend

Web3会员管理中心前端项目，基于Next.js 15 + TypeScript + Tailwind CSS开发。

## 🚀 快速开始

### 前置要求

- Node.js 20+
- npm 或 yarn
- Neon PostgreSQL数据库

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/web3-membership-frontend.git

# 进入项目目录
cd web3-membership-frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置
```

### 数据库设置

```bash
# 导入数据库Schema
psql $DATABASE_URL -f database/schema.sql

# 或者使用Neon CLI
neonctl sql-file database/schema.sql
```

### 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📦 项目结构

- `app/` - Next.js页面和路由
- `components/` - React组件
- `lib/` - API客户端和工具函数
- `database/` - 数据库Schema和迁移脚本
- `docs/` - 项目文档

## 🔗 相关链接

- [API文档](docs/API_DOCUMENTATION.md)
- [部署指南](docs/DEPLOYMENT_GUIDE.md)
- [后端API仓库](https://github.com/yourusername/web3-membership-backend)

## 📝 License

MIT
```

---

## ✅ 完成后的检查清单

- [ ] 代码已推送到GitHub
- [ ] 数据库Schema文件已上传
- [ ] .env.example文件已创建
- [ ] README.md已完善
- [ ] .gitignore已配置正确
- [ ] GitHub Actions已配置
- [ ] Secrets已在GitHub配置
- [ ] 仓库已设置为Private/Public（根据需求）

---

## 🆘 常见问题

**Q: 如何确保敏感信息不被上传到GitHub？**

A: .gitignore已配置忽略以下文件：
- .env
- .env.local
- .env.*.local
- node_modules/
- .next/

**Q: 如何与团队协作？**

A: 
1. 在GitHub添加协作者
2. 使用Pull Request进行代码审查
3. 配置Branch Protection规则

**Q: 数据库如何备份？**

A: Neon自动备份，也可以使用：
```bash
neonctl db-dump > backup-$(date +%Y%m%d).sql
```

---

## 📞 需要帮助？

如果在部署过程中遇到问题，请查看：
- [v0文档](https://v0.dev/docs)
- [Next.js文档](https://nextjs.org/docs)
- [Neon文档](https://neon.tech/docs)
```
