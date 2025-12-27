# 多语言系统使用指南

本项目已集成多语言支持系统，支持中文、英语和阿拉伯语。

## 使用方法

### 1. 在组件中使用翻译

\`\`\`tsx
'use client'

import { useLanguage } from '@/lib/i18n/context'

export function MyComponent() {
  const { t, language } = useLanguage()
  
  return (
    <div>
      <h1>{t('member.title')}</h1>
      <p>{t('member.walletAddress')}</p>
      <p>当前语言: {language}</p>
    </div>
  )
}
\`\`\`

### 2. 添加语言选择器

语言选择器已添加到：
- 登录页面（右上角）
- 会员中心头部 (MemberHeader 组件)

你可以在任何页面添加语言选择器：

\`\`\`tsx
import { LanguageSelector } from '@/components/language-selector'

<LanguageSelector />
\`\`\`

### 3. 添加新的翻译文本

编辑 `lib/i18n/translations.ts` 文件，在三个语言对象中添加相应的翻译：

\`\`\`typescript
export const translations = {
  zh: {
    myNewKey: '我的新文本',
    nested: {
      key: '嵌套的键'
    }
  },
  en: {
    myNewKey: 'My new text',
    nested: {
      key: 'Nested key'
    }
  },
  ar: {
    myNewKey: 'النص الجديد',
    nested: {
      key: 'مفتاح متداخل'
    }
  }
}
\`\`\`

### 4. RTL 支持

阿拉伯语自动启用 RTL（从右到左）布局。系统会自动：
- 设置 `dir="rtl"` 属性
- 反转 flex 方向
- 调整文本对齐

### 5. 编程方式切换语言

\`\`\`tsx
const { setLanguage } = useLanguage()

// 切换到英语
setLanguage('en')

// 切换到阿拉伯语
setLanguage('ar')

// 切换到中文
setLanguage('zh')
\`\`\`

## 已支持的翻译键

### 通用
- `welcome` - 欢迎
- `loading` - 加载中
- `confirm` - 确认
- `cancel` - 取消
- `save` - 保存
- `edit` - 编辑
- `delete` - 删除

### 导航 (nav.*)
- `nav.member` - 会员中心
- `nav.nodes` - 节点
- `nav.purchase` - 购买
- `nav.commissions` - 佣金
- `nav.transfer` - 转让市场
- `nav.logout` - 退出登录

### 会员中心 (member.*)
- `member.title` - 会员中心
- `member.walletAddress` - 钱包地址
- `member.ashvaBalance` - ASHVA 余额
- `member.memberLevel` - 会员等级
- `member.level.normal` - 普通会员
- `member.level.partner` - 合伙人
- `member.level.globalPartner` - 全球合伙人

### 节点 (nodes.*)
- `nodes.title` - 我的节点
- `nodes.cloudNode` - 云节点
- `nodes.imageNode` - 镜像节点
- `nodes.status` - 状态
- `nodes.earnings` - 收益

### 购买 (purchase.*)
- `purchase.title` - 购买节点
- `purchase.price` - 价格
- `purchase.confirm` - 确认购买
- `purchase.success` - 购买成功

### 佣金 (commissions.*)
- `commissions.title` - 我的佣金
- `commissions.total` - 总佣金
- `commissions.level1` - 一级佣金
- `commissions.level2` - 二级佣金

查看完整列表请参考 `lib/i18n/translations.ts`

## 注意事项

1. 所有使用翻译的组件必须是客户端组件（'use client'）
2. 翻译文本会自动保存到 localStorage
3. 页面刷新后会保持用户选择的语言
4. 阿拉伯语会自动应用 RTL 布局
