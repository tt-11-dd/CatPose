# CatPose 猫咪姿势贴纸收藏网站

本地预览：

```bash
npm install
npm run dev
```

浏览器打开提示的地址（一般是 http://localhost:5173）。手机扫同一 Wi-Fi 下的地址即可拍照。当前版本在浏览器里完成抠图和收藏，不配 Cloudflare 也能玩完整条链路。后面再接到 Workers / D1 / R2，并用同一套页面打包安卓。

---

## 技术架构与开发实施文档

**文档版本：** V1.0  
**编写日期：** 2026-11-02  
**项目类型：** Web App / 图片 AI 处理 / 个人收藏  
**部署平台：** Cloudflare  
**开发模式：** Serverless（无服务器架构）

---

# 1. 项目概述

## 1.1 项目目标

CatPose 是一款用于收集猫咪各种姿势的 Web 应用。

用户通过手机或电脑拍摄、上传猫咪照片，系统自动识别猫咪主体并移除背景，将其转换成具有白色描边、阴影效果的贴纸图片，最终保存到用户的个人收藏馆。

产品核心体验：

**拍照 → AI 抠图 → 生成贴纸 → 收藏 → 展示**

产品不只是一个图片抠图工具，而是一个以猫咪姿势为主题的收藏产品。

## 1.2 核心功能

| 模块     | 功能                     | 优先级 |
| -------- | ------------------------ | ------ |
| 首页     | 展示猫咪贴纸收藏墙       | P0     |
| 图片上传 | 拍照、相册上传、拖拽上传 | P0     |
| AI 抠图  | 自动去除照片背景         | P0     |
| 贴纸生成 | 白边、阴影、透明背景     | P0     |
| 收藏管理 | 保存、删除、查看贴纸     | P0     |
| 姿势分类 | 坐姿、睡姿、跳跃等       | P1     |
| 猫咪档案 | 猫咪名称、头像、描述     | P1     |
| 用户系统 | 注册、登录、个人收藏同步 | P1     |
| 成就系统 | 收藏数量、姿势解锁       | P2     |
| 社区功能 | 公开分享、点赞           | P3     |

## 1.3 第一阶段 MVP

第一阶段只实现以下闭环：

1. 用户打开网站。
2. 点击拍照或上传照片。
3. 预览原始照片。
4. 调用 AI API 自动抠图。
5. 生成贴纸效果。
6. 用户确认保存。
7. 首页展示新生成的猫咪贴纸。

第一阶段不开发复杂的社交功能，也不自行训练 AI 模型。

---

# 2. 技术选型

## 2.1 技术栈

| 层级     | 技术                               | 用途           |
| -------- | ---------------------------------- | -------------- |
| 前端框架 | React 19 + Vite                    | 网站界面       |
| 开发语言 | TypeScript                         | 类型安全       |
| UI 样式  | Tailwind CSS                       | 页面样式       |
| UI 组件  | shadcn/ui                          | 基础组件       |
| 图标     | Lucide                             | 图标           |
| 路由     | React Router                       | 页面路由       |
| 数据请求 | TanStack Query                     | API 请求与缓存 |
| 后端     | Cloudflare Workers                 | 后端 API       |
| 数据库   | Cloudflare D1                      | 业务数据       |
| 对象存储 | Cloudflare R2                      | 图片文件       |
| AI 抠图  | Cloudflare Workers AI / 第三方 API | 背景移除       |
| 图片处理 | Canvas API                         | 贴纸描边与阴影 |
| 部署     | Cloudflare Workers                 | 网站和后端部署 |
| 代码管理 | GitHub                             | 版本管理       |

采用 React + Vite 的原因：

- 不需要独立服务器。
- 前端静态资源可以部署到 Cloudflare。
- 后端 API 直接由 Workers 提供。
- 图片编辑可以在浏览器端完成。
- 前后端可以放在同一个代码仓库中。

## 2.2 Cloudflare 服务

### Cloudflare Workers

负责：

- 网站 API。
- 用户身份验证。
- 图片上传授权。
- AI 抠图任务。
- 图片元数据管理。
- 收藏数据查询。
- 删除和更新操作。

### Cloudflare D1

使用 SQLite 数据库，负责保存：

- 用户信息。
- 猫咪档案。
- 贴纸信息。
- 姿势分类。
- 任务状态。
- 收藏成就。

### Cloudflare R2

负责保存图片：

- 用户上传的原始照片。
- AI 抠图生成的透明图片。
- 最终贴纸图片。
- 后续生成的缩略图。

不建议把图片二进制数据存入 D1，只在数据库保存图片对象 Key 和相关元数据。

### Cloudflare Workers AI

可以作为第一阶段优先测试的抠图方案。

模型：

`bria/remove-background`

官方模型说明：

https://developers.cloudflare.com/ai/models/bria/remove-background/

该模型可以返回透明背景 PNG。官方页面当前列出的参考价格为每张图片 0.018 美元，实际费用以账户和价格页面为准。

同时保留第三方 API 适配器，避免后续被单一模型供应商绑定。

---

# 3. 系统架构

## 3.1 总体架构

```text
                  用户浏览器
                      |
                      v
             React + Vite 前端
                      |
                      v
             Cloudflare Workers
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
        D1数据库     R2存储     AI抠图服务
          |           |           |
          |           |           |
          v           v           v
        业务数据     图片文件    透明背景图片
                      |
                      v
               Canvas 图片处理
                      |
                      v
                生成贴纸图片
                      |
                      v
                 保存到 R2
                      |
                      v
                 更新 D1
                      |
                      v
                 首页展示
```

## 3.2 业务架构原则

1. 浏览器负责用户交互和轻量级图片编辑。
2. Workers 负责所有需要权限控制的业务逻辑。
3. D1 只存结构化数据。
4. R2 只存图片和文件。
5. AI 模型通过统一接口调用。
6. AI API Key 只能保存在 Workers Secrets 中。
7. 原始照片与处理后的照片分开保存。
8. 图片处理任务需要支持失败重试。

## 3.3 图片上传方式

建议采用 R2 预签名 URL。

上传流程：

```text
浏览器
  |
  | 1. 请求上传授权
  v
Workers API
  |
  | 2. 创建文件 Key
  | 3. 生成预签名 PUT URL
  v
浏览器
  |
  | 4. 直接上传图片
  v
R2 Bucket
  |
  | 5. 通知后端上传完成
  v
Workers API
  |
  v
创建图片处理任务
```

优点：

- 图片不必经过 Worker 中转。
- 降低 Worker 内存占用。
- 降低 API 处理压力。
- 更适合大尺寸照片。

技术注意：

R2 的 Workers Binding 本身不能生成 S3 预签名 URL，需要在 Worker 中使用 AWS SDK S3 Presigner 或 aws4fetch，并通过 Secrets 保存 R2 Access Key 和 Secret Key。

参考：

https://developers.cloudflare.com/r2/api/s3/presigned-urls/

---

# 4. 图片抠图和贴纸生成

这是整个产品最核心的技术模块。

## 4.1 图片处理流程

```text
用户上传原始图片
       |
       v
校验图片格式和尺寸
       |
       v
保存原图到 R2
       |
       v
调用 AI 背景移除 API
       |
       v
获取透明背景 PNG
       |
       v
检查图片是否有效
       |
       v
生成白色贴纸描边
       |
       v
增加阴影效果
       |
       v
自动裁剪透明区域
       |
       v
生成最终 PNG
       |
       v
上传 R2
       |
       v
更新 D1 处理状态
```

## 4.2 图片格式要求

上传支持：

- JPEG
- PNG
- WebP

建议第一版限制：

| 项目         | 限制             |
| ------------ | ---------------- |
| 最大上传体积 | 15 MB            |
| 最大图片边长 | 6000 px          |
| 图片格式     | JPG / PNG / WebP |
| 最终输出     | PNG              |
| 透明背景     | 必须保留         |
| 原始图片     | 单独保存         |

具体限制应同时满足所选 AI 服务的输入限制。

## 4.3 AI 抠图接口

统一封装一个接口：

```typescript
interface BackgroundRemovalProvider {
  removeBackground(image: ArrayBuffer): Promise<ArrayBuffer>;
}
```

后续可实现：

```text
providers/
  background-removal/
    index.ts
    cloudflare-ai.ts
    remove-bg.ts
```

第一版优先测试 Cloudflare Workers AI 的 Bria 模型。

调用逻辑示意：

```typescript
const result = await env.AI.run("bria/remove-background", {
  image: imageBuffer,
});
```

实际开发时需要根据当前模型输入要求处理图片输入，并将返回结果转换为统一的透明 PNG 数据。

注意：

- AI 返回结果需要验证。
- 需要检查 Alpha 通道。
- 不能直接信任外部图片 URL。
- 不允许用户通过提交任意 URL 让 Worker 随意抓取网络资源。
- API 失败时需要更新任务状态。

## 4.4 贴纸描边实现

AI 负责抠图，贴纸描边由 Canvas 处理。

基本思路：

1. 将透明背景 PNG 加载到 Canvas。
2. 提取图像 Alpha 通道。
3. 根据 Alpha 蒙版生成扩展轮廓。
4. 使用白色绘制轮廓。
5. 将原始猫咪图层覆盖在白色轮廓上。
6. 添加阴影。
7. 导出透明 PNG。

推荐初始参数：

| 参数        | 默认值           |
| ----------- | ---------------- |
| 白边宽度    | 12 px            |
| 白边颜色    | #FFFFFF          |
| 阴影颜色    | rgba(0,0,0,0.15) |
| 阴影模糊    | 8 px             |
| 阴影 X 偏移 | 0 px             |
| 阴影 Y 偏移 | 4 px             |
| 图片外边距  | 24 px            |

这些参数需要根据输出图片分辨率进行比例缩放，不能对所有尺寸固定使用同一像素宽度。

## 4.5 贴纸输出

建议每张贴纸至少保存：

```text
original.jpg
cutout.png
sticker.png
thumbnail.webp
```

其中：

- original：用户上传原图。
- cutout：AI 抠图结果。
- sticker：带白边和阴影的最终图片。
- thumbnail：首页展示用缩略图。

第一版可以先只生成 original、cutout 和 sticker，缩略图后续优化。

---

# 5. 数据库设计

数据库名称：

`catpose`

## 5.1 users 用户表

| 字段       | 类型    | 说明     |
| ---------- | ------- | -------- |
| id         | TEXT    | 用户 ID  |
| email      | TEXT    | 邮箱     |
| nickname   | TEXT    | 用户昵称 |
| avatar_url | TEXT    | 头像     |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

## 5.2 cats 猫咪档案表

| 字段        | 类型    | 说明        |
| ----------- | ------- | ----------- |
| id          | TEXT    | 猫咪 ID     |
| user_id     | TEXT    | 所属用户    |
| name        | TEXT    | 猫咪名称    |
| avatar_key  | TEXT    | 头像 R2 Key |
| description | TEXT    | 描述        |
| created_at  | INTEGER | 创建时间    |

一个用户可以创建多只猫咪档案。

## 5.3 pose_categories 姿势分类表

| 字段       | 类型    | 说明     |
| ---------- | ------- | -------- |
| id         | TEXT    | 分类 ID  |
| name       | TEXT    | 分类名称 |
| slug       | TEXT    | 分类标识 |
| icon       | TEXT    | 分类图标 |
| sort_order | INTEGER | 排序     |
| created_at | INTEGER | 创建时间 |

第一版预置分类：

- 坐姿 Sitting
- 睡姿 Sleeping
- 站姿 Standing
- 跳跃 Jumping
- 打滚 Rolling
- 伸懒腰 Stretching
- 卖萌 Cute
- 其他 Other

## 5.4 stickers 贴纸表

| 字段          | 类型    | 说明          |
| ------------- | ------- | ------------- |
| id            | TEXT    | 贴纸 ID       |
| user_id       | TEXT    | 所属用户      |
| cat_id        | TEXT    | 猫咪 ID       |
| category_id   | TEXT    | 姿势分类 ID   |
| title         | TEXT    | 贴纸名称      |
| original_key  | TEXT    | 原图 R2 Key   |
| cutout_key    | TEXT    | 抠图 R2 Key   |
| sticker_key   | TEXT    | 贴纸 R2 Key   |
| thumbnail_key | TEXT    | 缩略图 R2 Key |
| width         | INTEGER | 图片宽度      |
| height        | INTEGER | 图片高度      |
| status        | TEXT    | 处理状态      |
| created_at    | INTEGER | 创建时间      |
| updated_at    | INTEGER | 更新时间      |

状态定义：

- uploaded：上传完成。
- processing：正在抠图。
- editing：正在生成贴纸。
- completed：处理成功。
- failed：处理失败。

## 5.5 processing_jobs 处理任务表

| 字段          | 类型    | 说明          |
| ------------- | ------- | ------------- |
| id            | TEXT    | 任务 ID       |
| sticker_id    | TEXT    | 关联贴纸      |
| user_id       | TEXT    | 用户 ID       |
| status        | TEXT    | 任务状态      |
| provider      | TEXT    | AI 服务提供商 |
| error_code    | TEXT    | 错误代码      |
| error_message | TEXT    | 错误信息      |
| retry_count   | INTEGER | 重试次数      |
| started_at    | INTEGER | 开始时间      |
| finished_at   | INTEGER | 完成时间      |
| created_at    | INTEGER | 创建时间      |

## 5.6 数据库关系

```text
users
  |
  +---- cats
  |
  +---- stickers
           |
           +---- pose_categories
           |
           +---- processing_jobs
```

所有用户相关查询都必须验证 user_id，不能仅根据前端提交的 ID 查询或修改资源。

---

# 6. API 接口设计

统一 API 前缀：

`/api/v1`

统一返回格式：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

错误返回：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "IMAGE_PROCESS_FAILED",
    "message": "图片处理失败"
  }
}
```

## 6.1 用户接口

| 方法  | 路径            | 功能         |
| ----- | --------------- | ------------ |
| GET   | /users/me       | 获取当前用户 |
| PATCH | /users/me       | 更新个人资料 |
| GET   | /users/me/stats | 获取收藏统计 |

## 6.2 猫咪接口

| 方法   | 路径      | 功能         |
| ------ | --------- | ------------ |
| GET    | /cats     | 获取猫咪列表 |
| POST   | /cats     | 创建猫咪档案 |
| GET    | /cats/:id | 获取猫咪详情 |
| PATCH  | /cats/:id | 更新猫咪档案 |
| DELETE | /cats/:id | 删除猫咪档案 |

## 6.3 图片上传接口

### 创建上传授权

`POST /uploads/presign`

请求：

```json
{
  "filename": "cat.jpg",
  "contentType": "image/jpeg",
  "size": 2048000
}
```

返回：

```json
{
  "success": true,
  "data": {
    "uploadUrl": "SIGNED_URL",
    "objectKey": "original/user-id/image-id.jpg",
    "expiresIn": 600
  }
}
```

### 确认上传完成

`POST /uploads/complete`

请求：

```json
{
  "objectKey": "original/user-id/image-id.jpg"
}
```

后端检查对象是否真实存在，并验证大小和元数据。

## 6.4 贴纸接口

| 方法   | 路径                 | 功能             |
| ------ | -------------------- | ---------------- |
| POST   | /stickers            | 创建贴纸处理任务 |
| GET    | /stickers            | 获取贴纸列表     |
| GET    | /stickers/:id        | 获取贴纸详情     |
| PATCH  | /stickers/:id        | 更新名称、分类   |
| DELETE | /stickers/:id        | 删除贴纸         |
| GET    | /stickers/:id/status | 查询处理进度     |

创建任务：

`POST /stickers`

请求：

```json
{
  "catId": "cat_001",
  "originalKey": "original/user-001/image-001.jpg",
  "categoryId": "sleeping",
  "title": "睡觉的小猫"
}
```

返回：

```json
{
  "success": true,
  "data": {
    "stickerId": "sticker_001",
    "jobId": "job_001",
    "status": "processing"
  }
}
```

## 6.5 收藏接口

| 方法 | 路径                    | 功能             |
| ---- | ----------------------- | ---------------- |
| GET  | /collections            | 获取收藏墙       |
| GET  | /collections/categories | 获取分类收藏数量 |
| GET  | /collections/stats      | 获取收藏统计     |

---

# 7. 前端页面设计

## 7.1 首页

路由：

`/`

主要区域：

- Logo 和产品名称。
- 用户头像。
- 拍摄猫咪按钮。
- 最近收藏的猫咪贴纸。
- 姿势分类。
- 已收集数量。
- 底部导航。

首页风格：

- 暖白色背景。
- 橙黄色主色调。
- 圆角卡片。
- 猫咪贴纸采用不规则布局。
- 每张贴纸有明显白色描边。
- 使用柔和阴影。

## 7.2 拍照页面

路由：

`/capture`

功能：

- 调用浏览器摄像头。
- 支持切换前后摄像头。
- 拍摄照片。
- 从相册上传。
- 图片预览。
- 重新拍摄。
- 确认使用。

移动端使用 `navigator.mediaDevices.getUserMedia()`，需要 HTTPS 环境及用户授权。

摄像头不可用时必须提供相册上传作为备用入口。

## 7.3 图片编辑页面

路由：

`/editor/:id`

主要功能：

- 显示原始照片。
- 显示 AI 抠图结果。
- 显示贴纸预览。
- 支持重新抠图。
- 调整白边宽度。
- 调整阴影。
- 修改贴纸名称。
- 选择猫咪档案。
- 选择姿势分类。
- 保存贴纸。

## 7.4 收藏馆

路由：

`/collection`

功能：

- 网格展示贴纸。
- 分类筛选。
- 按时间排序。
- 查看贴纸详情。
- 删除贴纸。
- 下载 PNG。

## 7.5 个人中心

路由：

`/profile`

功能：

- 用户头像。
- 用户昵称。
- 猫咪档案。
- 收藏数量。
- 已完成成就。
- 设置。

---

# 8. 项目目录结构

建议采用单仓库架构。

```text
catpose/
│
├── public/
│   ├── logo.svg
│   └── icons/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── sticker/
│   │   └── upload/
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── CapturePage.tsx
│   │   ├── EditorPage.tsx
│   │   ├── CollectionPage.tsx
│   │   └── ProfilePage.tsx
│   │
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── router/
│   └── App.tsx
│
├── worker/
│   ├── index.ts
│   ├── routes/
│   │   ├── users.ts
│   │   ├── cats.ts
│   │   ├── uploads.ts
│   │   ├── stickers.ts
│   │   └── collections.ts
│   │
│   ├── services/
│   │   ├── storage.ts
│   │   ├── image-processing.ts
│   │   ├── sticker-generator.ts
│   │   └── background-removal.ts
│   │
│   ├── providers/
│   │   └── background-removal/
│   │       ├── index.ts
│   │       ├── cloudflare-ai.ts
│   │       └── remove-bg.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   │
│   └── types/
│
├── migrations/
│   ├── 0001_init.sql
│   └── 0002_seed_categories.sql
│
├── tests/
│   ├── api/
│   └── unit/
│
├── wrangler.jsonc
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

# 9. Cloudflare 配置

## 9.1 创建资源

首先安装 Node.js 和 npm，然后执行：

```bash
npm create cloudflare@latest catpose -- --framework=react
cd catpose
```

安装项目依赖：

```bash
npm install
```

创建 D1 数据库：

```bash
npx wrangler d1 create catpose-db
```

创建 R2 Bucket：

```bash
npx wrangler r2 bucket create catpose-images
```

创建完成后，将 D1 返回的 database_id 配置到 Wrangler。

## 9.2 Wrangler 配置

文件：

`wrangler.jsonc`

示例：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "catpose",
  "main": "./worker/index.ts",
  "compatibility_date": "2026-11-02",
  "assets": {
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"],
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "catpose-db",
      "database_id": "YOUR_DATABASE_ID",
    },
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "catpose-images",
    },
  ],
  "ai": {
    "binding": "AI",
  },
}
```

具体字段以当前 Wrangler 版本生成的配置 Schema 为准。

## 9.3 配置 Secrets

不要将 API Key 写入前端代码、Git 仓库或公开的配置文件。

例如：

```bash
npx wrangler secret put REMOVE_BG_API_KEY
```

如果采用 R2 预签名 URL，还需要配置：

```bash
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

其他必要配置：

- CLOUDFLARE_ACCOUNT_ID
- AI 服务相关密钥
- SESSION_SECRET
- AUTH_SECRET

Cloudflare Workers Secrets 官方文档：

https://developers.cloudflare.com/workers/configuration/secrets/

## 9.4 数据库迁移

创建迁移文件：

`migrations/0001_init.sql`

数据库表至少包括：

- users
- cats
- pose_categories
- stickers
- processing_jobs

本地执行：

```bash
npx wrangler d1 migrations apply catpose-db --local
```

生产环境执行：

```bash
npx wrangler d1 migrations apply catpose-db --remote
```

## 9.5 本地运行

```bash
npm run dev
```

构建：

```bash
npm run build
```

部署：

```bash
npx wrangler deploy
```

建议先通过 Workers Preview 测试完整流程，再绑定正式域名。

---

# 10. 图片存储规范

R2 Bucket：

`catpose-images`

对象 Key 设计：

```text
original/
  user-id/
    image-id.jpg

cutout/
  user-id/
    sticker-id.png

stickers/
  user-id/
    sticker-id.png

thumbnails/
  user-id/
    sticker-id.webp

avatars/
  user-id/
    avatar.webp
```

要求：

1. 文件名使用 UUID，不直接使用用户原始文件名。
2. 不允许用户直接指定任意 R2 Key。
3. 后端必须校验对象归属。
4. 图片 URL 不直接作为永久业务标识。
5. 私有图片通过授权接口生成短期访问 URL。
6. 删除贴纸时，同时处理相关 R2 文件。
7. 删除失败时记录清理任务，避免孤儿文件。

建议初期使用一个私有 Bucket，图片通过 Worker 鉴权代理访问；后续可以针对公开分享的贴纸增加单独的公开资源域名。

R2 浏览器直传必须正确配置 CORS，允许指定网站 Origin、PUT 方法及必要的 Content-Type 请求头。

---

# 11. 图片处理任务机制

第一版可以同步发起处理请求，但建议从一开始就使用任务状态机制。

状态流转：

```text
uploaded
    |
    v
processing
    |
    +-------> failed
    |
    v
editing
    |
    v
completed
```

用户提交任务后，立即返回 jobId。

前端每隔约 2 秒轮询：

`GET /api/v1/stickers/:id/status`

处理成功后展示最终图片。

如果后续图片处理量增加，增加 Cloudflare Queues：

```text
Workers API
    |
    v
Queues
    |
    v
Consumer Worker
    |
    v
AI 抠图
    |
    v
生成贴纸
    |
    v
更新 D1
```

Queues 用于异步执行、重试及失败任务管理。应配置最大重试次数和死信队列，避免任务永久丢失。

注意：Worker 的请求执行限制和内存限制需要考虑。不要将大规模图片计算或长时间 GPU 推理放进普通 Worker 执行。

---

# 12. 用户系统与安全

## 12.1 用户身份

第一版可以先实现基础用户体系：

- 用户注册。
- 邮箱登录。
- Session 管理。
- 退出登录。
- 用户资料管理。

优先评估支持 Cloudflare Workers 和 D1 的成熟认证方案，例如 Better Auth。

不要自己编写不成熟的密码存储或 Session 加密实现。

## 12.2 图片安全

必须处理：

- 文件 MIME 类型校验。
- 文件大小校验。
- 图片真实格式校验。
- 图片尺寸限制。
- 恶意文件拦截。
- API 请求频率限制。
- 用户文件访问权限。
- API Key 保护。

不能只相信前端提交的 Content-Type。

## 12.3 API 安全

所有需要用户身份的接口必须验证 Session。

例如：

用户 A 不允许访问用户 B 的贴纸。

后端必须验证：

```text
sticker.user_id === currentUser.id
```

同时需要：

- 限制每个用户每天的抠图次数。
- 限制单张图片大小。
- 防止重复提交同一任务。
- 对第三方 AI 调用增加超时处理。
- 记录 AI 服务调用次数和费用。
- 对异常请求进行日志记录。

---

# 13. 错误处理

统一错误码：

| 错误码               | 说明           |
| -------------------- | -------------- |
| INVALID_IMAGE        | 图片格式不支持 |
| IMAGE_TOO_LARGE      | 图片过大       |
| UPLOAD_FAILED        | 上传失败       |
| AI_PROVIDER_ERROR    | AI 服务异常    |
| IMAGE_PROCESS_FAILED | 图片处理失败   |
| STICKER_NOT_FOUND    | 贴纸不存在     |
| PERMISSION_DENIED    | 没有访问权限   |
| RATE_LIMITED         | 请求频率过高   |
| STORAGE_ERROR        | 存储异常       |
| DATABASE_ERROR       | 数据库异常     |

错误信息不能直接向用户暴露内部 API Key、请求头、服务器路径和完整堆栈。

---

# 14. 测试计划

## 14.1 功能测试

- [ ] 网站正常访问。
- [ ] 手机摄像头授权。
- [ ] 手机相册上传。
- [ ] 桌面端拖拽上传。
- [ ] AI 抠图成功。
- [ ] 透明背景正确。
- [ ] 猫咪毛发边缘清晰。
- [ ] 白色描边正常。
- [ ] 阴影效果正常。
- [ ] 贴纸保存成功。
- [ ] 首页正常展示。
- [ ] 分类筛选正常。
- [ ] 删除贴纸正常。
- [ ] 图片下载正常。

## 14.2 异常测试

- [ ] 上传损坏图片。
- [ ] 上传超大图片。
- [ ] 上传非图片文件。
- [ ] AI 服务超时。
- [ ] AI API 返回错误。
- [ ] R2 上传失败。
- [ ] D1 写入失败。
- [ ] 用户重复提交任务。
- [ ] 用户访问其他人的图片。
- [ ] 处理过程中刷新页面。

## 14.3 设备测试

重点测试：

- iPhone Safari。
- Android Chrome。
- Mac Chrome。
- Windows Chrome。

移动端是主要使用场景，拍照和相册上传必须重点验证。

---

# 15. 开发阶段规划

## 第一阶段：项目初始化

目标：搭建完整开发环境。

任务：

- 初始化 React + Vite。
- 配置 TypeScript。
- 配置 Tailwind CSS。
- 配置 Cloudflare Vite Plugin。
- 配置 Workers。
- 创建 D1。
- 创建 R2。
- 配置本地开发环境。

交付结果：网站可以在本地运行，并成功部署到 Cloudflare。

## 第二阶段：核心页面

目标：完成 UI。

任务：

- 首页贴纸墙。
- 拍照页面。
- 上传页面。
- 贴纸编辑页面。
- 收藏馆。
- 个人中心。

交付结果：完整的前端交互流程。

## 第三阶段：图片处理

目标：跑通 AI 抠图。

任务：

- 图片上传授权。
- R2 直传。
- AI API 接入。
- 透明 PNG 获取。
- Canvas 白边生成。
- 阴影处理。
- 最终贴纸保存。

交付结果：用户可以上传猫咪照片并得到贴纸。

## 第四阶段：数据持久化

目标：保存用户收藏。

任务：

- D1 数据表。
- 用户系统。
- 猫咪档案。
- 贴纸记录。
- 收藏列表。
- 删除和编辑。

交付结果：用户刷新页面后，收藏仍然存在。

## 第五阶段：部署和优化

目标：正式上线。

任务：

- Cloudflare 正式部署。
- 绑定域名。
- 配置 HTTPS。
- 配置 R2 CORS。
- 配置日志。
- 图片访问优化。
- 安全测试。
- 手机端兼容测试。

交付结果：正式可访问的 CatPose 网站。

---

# 16. 成本控制

第一版尽量控制在 Cloudflare 免费额度及少量 AI 调用费用内。

主要费用来源：

| 服务       | 计费关注点           |
| ---------- | -------------------- |
| Workers    | 请求量、CPU 使用量   |
| D1         | 数据读写量、存储     |
| R2         | 图片存储量、操作次数 |
| Workers AI | AI 模型调用量        |
| 第三方 AI  | 按图片处理量计费     |
| 域名       | 年度域名费用         |

特别注意：

AI 抠图是主要的可变成本。

如果采用 Bria 的当前参考价格 $0.018/张：

|  图片数量 | 参考抠图费用 |
| --------: | -----------: |
|    100 张 |        $1.80 |
|  1,000 张 |          $18 |
| 10,000 张 |         $180 |

以上仅计算模型调用费用，不包含其他服务费用，且应以实际账单为准。

需要设置用户每日处理次数限制和总调用预算。

---

# 17. 后续版本规划

## V1.0：基础收藏

- 拍照上传。
- AI 抠图。
- 贴纸生成。
- 个人收藏墙。
- 基础用户系统。

## V1.1：猫咪档案

- 多猫咪管理。
- 猫咪头像。
- 猫咪名称。
- 贴纸按猫咪归档。

## V1.2：姿势智能识别

- 自动识别坐姿。
- 自动识别睡姿。
- 自动识别跳跃。
- 自动推荐收藏分类。

注意：背景抠除和姿势分类属于不同的 AI 任务，需要单独实现。

## V1.3：成就系统

- 收藏数量。
- 姿势收集进度。
- 特殊姿势解锁。
- 连续收集奖励。

## V2.0：分享社区

- 公开贴纸。
- 分享链接。
- 点赞。
- 收藏其他用户的贴纸。
- 猫咪姿势排行榜。

---

# 18. Codex / Cursor 开发约束

开发过程中必须遵守：

1. 使用 TypeScript，不允许大规模使用 any。
2. 前端和后端分层，不能把数据库操作写进 React 组件。
3. 所有 API 统一放在 `/api/v1`。
4. 所有图片处理逻辑必须独立封装。
5. AI 抠图服务必须使用 Provider 适配器模式。
6. 不允许在前端暴露 API Key。
7. 不允许将图片 Base64 长期保存在 D1。
8. 不允许将 R2 Secret 写入 Git。
9. 所有数据库变更必须使用 migrations。
10. 所有涉及用户数据的接口必须检查资源归属。
11. 每个阶段完成后进行功能测试。
12. 不允许用静态假数据冒充已经完成的 AI 抠图功能。
13. 页面必须适配桌面端和移动端。
14. 图片处理失败时必须有可见错误提示和重试入口。
15. 必须保留原图，不能只保存最终贴纸。

## 最终验收标准

用户能够在手机浏览器打开 CatPose，拍摄一张真实猫咪照片，上传到网站，等待 AI 自动移除背景，生成具有白色描边和阴影的透明贴纸，并将其保存到自己的收藏首页。

**这条完整链路跑通，即代表 CatPose 第一阶段 MVP 成功。**

---

# 19. 官方技术文档

- Cloudflare Workers：https://developers.cloudflare.com/workers/
- React + Vite 部署：https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
- Cloudflare D1：https://developers.cloudflare.com/d1/
- Cloudflare R2：https://developers.cloudflare.com/r2/
- R2 预签名 URL：https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- R2 CORS：https://developers.cloudflare.com/r2/buckets/cors/
- Workers AI：https://developers.cloudflare.com/workers-ai/
- Bria 背景移除：https://developers.cloudflare.com/ai/models/bria/remove-background/
- Workers Queues：https://developers.cloudflare.com/queues/
- Workers Secrets：https://developers.cloudflare.com/workers/configuration/secrets/

**文档结束**
