# WalletConnect 配置说明

## 1. 注册 WalletConnect Cloud

访问 https://cloud.walletconnect.com/ 注册免费账户

## 2. 创建项目

1. 登录后，点击 "Create Project"
2. 输入项目名称：Ashva 会员中心
3. 选择项目类型：dApp
4. 复制生成的 Project ID

## 3. 添加环境变量

在 Vercel 项目的环境变量中添加：

\`\`\`
变量名: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
变量值: 您的 Project ID (例如: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6)
\`\`\`

## 4. 功能说明

配置完成后，扫码登录功能将支持：

- **电脑端**: 点击按钮后自动显示二维码，使用手机钱包扫码连接
- **手机端**: 点击按钮后自动打开已安装的钱包应用，选择钱包连接

支持的钱包包括：
- MetaMask Mobile
- Trust Wallet
- imToken
- Rainbow
- Coinbase Wallet
- 以及所有支持 WalletConnect 的钱包

## 5. 验证流程

连接成功后，系统会自动：
1. 获取用户钱包地址
2. 查询 ASHVA 代币余额（合约: 0xea75cb12bbe6232eb082b365f450d3fe06d02fb3）
3. 验证用户是否持有 ASHVA
4. 保存钱包地址到数据库
5. 跳转到会员中心

只有持有 ASHVA 代币的用户才能成功登录。
