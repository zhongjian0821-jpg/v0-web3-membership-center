# Ashva Web3 会员中心

## 项目说明
Ashva 区块链节点平台的会员中心前端

## 功能特性
- 🔐 Web3 钱包连接
- 📊 节点统计展示
- 💰 钱包资产查看
- 🖥️ 节点管理
- 📱 响应式设计

## 技术栈
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Web3 集成

## 后端 API
连接到 PVE 运营中心后端:
- API: https://pve-operations-api-production.up.railway.app
- 管理后台: https://v0-pve-operations-center.vercel.app

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

访问 http://localhost:3000

## 环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

## 部署

项目已部署到 Vercel:
- 生产环境: https://v0-web3-membership-center.vercel.app

## 主要页面

- `/` - 主页(重定向到会员中心)
- `/member` - 会员中心(核心功能页面)

## 数据流

```
用户 → Web3 钱包连接 → 前端 → PVE 后端 API → Neon PostgreSQL
```

## License

MIT
