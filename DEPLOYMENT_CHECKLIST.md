# 部署检查清单

## 前端部署前检查 ✓

- [ ] 环境变量已设置
  - [ ] `NEXT_PUBLIC_BACKEND_API_URL` 指向正确的后端地址
  - [ ] 其他钱包相关环境变量已配置
  
- [ ] API客户端已集成
  - [ ] `lib/api-client.ts` 文件存在
  - [ ] `lib/api-types.ts` 类型定义完整
  
- [ ] 登录页面已更新
  - [ ] 使用 `apiClient.connectWallet()` 替代直接数据库查询
  - [ ] token保存逻辑正确
  
- [ ] 会员页面已更新
  - [ ] 使用API获取数据而非直接查询数据库
  - [ ] 错误处理完善
  
- [ ] 测试通过
  - [ ] 登录流程
  - [ ] 数据获取
  - [ ] 错误提示

## 后端部署前检查 ✓

- [ ] 数据库连接
  - [ ] Neon数据库URL正确
  - [ ] 连接池配置合理
  
- [ ] 环境变量已配置
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `RPC_URL`
  - [ ] `CORS_ORIGINS` 包含前端域名
  
- [ ] API接口测试
  - [ ] 所有6个接口返回正确
  - [ ] 错误处理完善
  - [ ] 响应格式统一
  
- [ ] 安全配置
  - [ ] CORS正确配置
  - [ ] JWT认证工作正常
  - [ ] SQL注入防护
  
- [ ] 性能优化
  - [ ] 数据库查询优化
  - [ ] 响应时间合理（<500ms）

## 部署后验证 ✓

- [ ] 健康检查
  ```bash
  curl https://api.yourdomain.com/health
  ```
  
- [ ] API测试
  ```bash
  curl -X POST https://api.yourdomain.com/api/v1/wallet/connect \
    -H "Content-Type: application/json" \
    -d '{"walletAddress":"0x..."}'
  ```
  
- [ ] 前端连接测试
  - [ ] 能成功登录
  - [ ] 数据正常显示
  - [ ] 跨域请求无错误
  
- [ ] 监控配置
  - [ ] 错误日志收集
  - [ ] 性能监控
  - [ ] 告警设置
