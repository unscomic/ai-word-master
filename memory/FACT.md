# 项目：英语单词 AI 学习助手 (AI Word Master)

## 概述
面向大学生/成人的 AI 驱动英语单词学习 Web 应用，覆盖四六级、考研、雅思、托福。

## 技术栈
- **前端/后端**：Next.js 15 (App Router) + React 19，全栈方案
- **UI**：Tailwind CSS + shadcn/ui
- **状态管理**：Zustand
- **数据库**：PostgreSQL + Prisma ORM + Redis 缓存
- **认证**：NextAuth.js (Auth.js v5)
- **AI**：Claude API (@anthropic-ai/sdk)
- **TTS**：Web Speech API
- **部署**：Vercel

## 文档位置
- PRD：`PRD.md`
- TASK_LIST.md：`TASK_LIST.md`

## 核心功能（Phase 1 MVP）
1. 用户注册/登录
2. 预设词库（四级/考研）
3. AI 单词学习卡片（释义、例句、词根、记忆口诀）
4. SM-2 间隔重复复习
5. TTS 发音
6. 学习仪表盘

## 关键决策
- 高频 AI 调用场景采用预生成+缓存策略控制成本
- 学习进度数据模型基于 SM-2 算法设计
- 优先移动端体验（单词学习以移动端为主场景）

## 开发铁律（用户明确要求，必须遵守）
1. **模块化开发 + 测试模式**：每完成一个小功能就自己测试验证，不能等到最后
2. **小步提交**：每完成一个小功能并验证通过后，立即提交到 GitHub 仓库
3. **全面测试**：能测试的地方全部测试，不得遗漏
4. **绝不跳过测试**：不允许出现"这个先跳过，后面再测"的做法
