# Web3 Membership Center - Frontend

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Web3会员管理中心前端项目 - 基于Next.js 15 + TypeScript + Tailwind CSS开发

[在线演示](https://member.yourdomain.com) · [API文档](docs/FRONTEND_API_DOCUMENTATION.md) · [部署指南](GITHUB_DEPLOYMENT_GUIDE.md)

</div>

---

## ✨ 功能特性

- 🔐 **钱包登录** - 支持多种Web3钱包连接
- 👥 **会员管理** - 多级会员体系（普通/节点/区域/全球合伙人）
- 💰 **收益管理** - 实时收益统计和佣金分配
- 🖥️ **节点管理** - 云节点和镜像节点购买、管理
- 📊 **团队管理** - 直推团队和全局团队查看
- 💸 **提现功能** - ASHVA代币提现申请和历史
- 🔄 **节点转让** - 节点转让市场和交易
- 📈 **数据统计** - 完整的数据分析和报表

## 🚀 快速开始

### 前置要求

- Node.js 20+ 
- npm 或 yarn
- Neon PostgreSQL数据库

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/web3-membership-frontend.git
cd web3-membership-frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的配置

# 4. 导入数据库Schema
psql $DATABASE_URL -f database/schema.sql

# 5. 运行开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📦 项目结构

```
web3-membership-frontend/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # 认证相关页面
│   ├── member/                  # 会员中心
│   ├── nodes/                   # 节点管理
│   ├── withdraw/                # 提现功能
│   └── api/                     # API路由（待迁移）
├── components/                  # React组件
│   ├── ui/                      # 基础UI组件
│   └── ...                      # 业务组件
├── lib/                         # 工具函数
│   ├── api-client.ts            # API客户端
│   ├── api-types.ts             # TypeScript类型
│   └── utils.ts                 # 工具函数
├── database/                    # 数据库文件
│   ├── schema.sql               # 完整Schema
│   ├── migrations/              # 迁移脚本
│   └── README.md                # 数据库说明
├── docs/                        # 文档
│   ├── FRONTEND_API_DOCUMENTATION.md
│   ├── WALLET_LOGIN_API_REPLACEMENT_GUIDE.md
│   └── GITHUB_DEPLOYMENT_GUIDE.md
├── public/                      # 静态资源
├── .env.example                 # 环境变量模板
├── package.json
└── README.md
```

## 🔧 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5.0
- **样式**: Tailwind CSS v4
- **UI组件**: shadcn/ui
- **数据库**: Neon PostgreSQL
- **区块链**: Ethers.js, WalletConnect
- **部署**: Vercel

## 📖 核心文档

| 文档 | 说明 |
|------|------|
| [API文档](docs/FRONTEND_API_DOCUMENTATION.md) | 完整的55个API接口文档 |
| [钱包登录替换指南](docs/WALLET_LOGIN_API_REPLACEMENT_GUIDE.md) | 如何替换成外部API |
| [部署指南](GITHUB_DEPLOYMENT_GUIDE.md) | GitHub和Vercel部署说明 |
| [数据库说明](database/README.md) | 数据库表结构和使用 |

## 🔗 相关链接

- **后端API仓库**: https://github.com/yourusername/web3-membership-backend
- **API文档在线版**: https://api-docs.yourdomain.com
- **Neon控制台**: https://console.neon.tech

## 🚢 部署

### Vercel部署（推荐）

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

详细步骤见 [部署指南](GITHUB_DEPLOYMENT_GUIDE.md)

### 手动部署

```bash
npm run build
npm start
```

## 🔐 环境变量配置

关键环境变量（完整列表见 `.env.example`）：

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ASHVA_CONTRACT_ADDRESS=0x...
```

## 🧪 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
```

## 🤝 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📝 License

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目维护者: [@yourusername](https://github.com/yourusername)
- 问题反馈: [GitHub Issues](https://github.com/yourusername/web3-membership-frontend/issues)

---

<div align="center">
Made with ❤️ by Web3 Membership Team
</div>
