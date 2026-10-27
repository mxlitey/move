# 挪车码 MoveCar-QR

> 贴在挡风玻璃上的二维码 —— 他人扫码即可一键呼叫车主，全程无服务器、无数据库、零成本。

![status](https://img.shields.io/badge/status-MVP%20ready-green)
![runtime](https://img.shields.io/badge/runtime-Alibaba%20Cloud%20ESA-orange)
![deps](https://img.shields.io/badge/dependencies-2%20dev--only-blue)
![tests](https://img.shields.io/badge/smoke%20tests-102%20passed-brightgreen)

**特点一览**

- 🏗️ **Serverless 到底**：单个边缘函数 + 单个 EdgeKV 命名空间，无源站、无数据库、无服务器
- 💸 **长期零成本**：挪车场景请求量极低，ESA 免费版 10 万次/天绰绰有余
- 🔒 **号码不落页面**：扫码页 HTML 不含手机号，点「呼叫」时才取号，且 IP 限流
- 🎨 **圆形二维码**：圆点矩阵 + 定位角完整保留，H 级纠错，SVG/PNG/A6 打印三件套
- ⚡ **部署极简**：`npm run build` 产出一个 ~150 KB 的 `dist/index.js`，粘贴即发布

[功能演示](#功能) · [快速开始](#快速开始) · [架构](#架构) · [API](#api) · [部署](#部署) · [FAQ](#faq)

---

## 功能

### 扫码页 `/p/{siteId}`

他人微信扫码后看到的移动端页面：

- 展示车主名下车辆（车牌），多车单选，单车自动跳过选择
- 支持一车一码：二维码带 `?car={carId}` 时只显示该车，呼叫按钮为大圆形，一屏直达
- 「一键呼叫车主」大按钮 → 确认弹层显示脱敏号码（`138****0000`）→ 调起系统拨号
- 车辆全部停用或页面不存在时展示友好兜底页，不泄露任何信息

### 管理后台 `/admin`

密码保护的单管理员后台：

- 车辆 CRUD：新增 / 编辑 / 启用停用 / 排序，车辆 ID 可自编
- 二维码：整页一码或一车一码切换，圆形码预览、SVG / PNG / JPG 下载、复制链接、A6 打印车贴
- 页面设置：标题、提示语、重置公开 ID（旧码立即作废）
- 账号安全：PBKDF2 密码摘要存储，改密后旧会话全部失效

## 快速开始

```bash
# 1. 安装依赖（仅 esbuild 与 qrcode-generator 两个开发依赖）
npm install

# 2. 构建：内联 CSS/JS → dist/index.js
npm run build

# 3. 本地开发（mock EdgeKV）
npm run dev
# 打开 http://localhost:8899/admin 初始化管理员密码并录入车辆
# 打开 http://localhost:8899/p/{siteId} 体验扫码页

# 4. 端到端冒烟测试（需先运行 npm run dev）
npm run smoke
```

## 架构

```
                    ┌──────────────────────────────┐
  他人扫码  ───────▶ │  移动端页面 /p/{siteId}       │
                    │  车辆列表 → 一键呼叫           │
                    └──────────────┬───────────────┘
                                   │ POST /api/p/{id}/contact
                                   ▼
  ┌───────────────────────────────────────────────────────────┐
  │            阿里云 ESA 边缘函数（单函数，多路由）             │
  │  /p/{id}         服务端渲染移动端 HTML（不含手机号）         │
  │  /admin          登录 / 后台（同一 HTML 外壳，服务端判态）    │
  │  /api/*          JSON API + 会话校验 + 限流                  │
  │  /p/{id}/qr.svg  SVG 生成（服务端兜底）                      │
  └───────────────┬───────────────────────────┬───────────────┘
                  │ EdgeKV get/put             │ 域名绑定
                  ▼                            ▼
        ┌────────────────────┐        move.example.com (CNAME)
        │ KV 命名空间 movecar │
        │ site               │
        │ auth_admin / rl_*  │
        └────────────────────┘
```

**核心设计：整站 = 一个 KV key = 一个 JSON 文档。**

ESA 函数单次执行最多 4 个子请求，KV 又没有按前缀列 key 的能力，分表存储会撞上 N+1 读问题。单 key 整存整取天然只有 1 次读、2 次写（读 `rev` + 写），几十辆车不足 10 KB，远低于 1.8 MB 上限。写入用 `rev` 版本号做乐观锁，防止多标签页互相覆盖。

### 数据模型

| KV Key | 结构 | 说明 |
|---|---|---|
| `site` | 站点文档 JSON | 公开 ID + 文案 + 全部车辆，一次读、一次写 |
| `auth_admin` | `{alg,iter,salt,hash,ver}` | 管理员密码摘要（PBKDF2），`ver` 作废旧会话 |
| `rl_{bucket}_{ip}_{slot}` | `{n,blockedUntil}` | 限流计数（近似） |

### 安全设计

- 密码 PBKDF2-SHA256（12 万次迭代 + 随机盐），不存明文
- 无状态会话：`HMAC-SHA256` 签名的 Cookie（`HttpOnly; Secure; SameSite=Lax`），`ADMIN_SECRET` 走加密函数变量注入
- 手机号保护：页面只渲染脱敏号，完整号码仅在点呼时经限流接口返回（`no-store`）
- 写接口校验 `Origin` 同源 + `SameSite=Lax` 防 CSRF
- 全站 CSP `default-src 'self'`，页面 `noindex` 禁收录

## API

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/p/{siteId}` | 公开 | 扫码页 HTML（30 s 边缘缓存），`?car={carId}` 只看该车 |
| POST | `/api/p/{siteId}/contact` | 公开 + 限流 | body `{carId}`，返回 `{phone, plate}` |
| GET | `/p/{siteId}/qr.svg` | 公开 | 二维码 SVG（缓存 1 天），可带 `?car={carId}` |
| GET | `/admin` | 公开 | 初始化 / 登录 / 后台（服务端判态） |
| POST | `/api/admin/init` | 公开 + 限流 | 首次设置密码（仅一次） |
| POST | `/api/admin/login` | 公开 + 限流 | `{password}` → Set-Cookie 会话 |
| POST | `/api/admin/logout` | 公开 | 清除 Cookie |
| GET | `/api/admin/session` | 需会话 | 返回站点数据与页面地址 |
| PUT | `/api/admin/page` | 需会话 | 更新标题/提示语（带 `rev`） |
| POST | `/api/admin/page/reset-id` | 需会话 | 重置公开 ID，旧码作废 |
| POST | `/api/admin/car` | 需会话 | 新增或更新车辆（带 `rev`，可选 `carCode` 自编车辆 ID） |
| DELETE | `/api/admin/car?id=&rev=` | 需会话 | 删除车辆 |
| POST | `/api/admin/password` | 需会话 | 修改密码，旧会话全部失效 |

统一响应格式：`{ok:true,data}` / `{ok:false,code,message}`，错误码见 `UNAUTHORIZED / NOT_FOUND / RATE_LIMITED / REV_CONFLICT / INVALID_INPUT`。

## 项目结构

```
move/
├─ docs/
│  └─ 挪车码-实施计划.md     # 完整设计与决策记录
├─ src/
│  ├─ shared/
│  │  └─ qr.js               # 圆形二维码渲染（前后端共用）
│  ├─ worker/                # 边缘函数
│  │  ├─ index.js            # 入口：路由分发 + 同源校验
│  │  ├─ handlers/           # 页面 / 公开 API / 管理 API
│  │  ├─ views/              # 扫码页与后台视图（SSR）
│  │  ├─ lib/                # kv / auth / ratelimit / http / layout / validate
│  │  └─ generated/          # 构建产物（CSS/JS 内联，自动生成）
│  └─ web/                   # 前端源码（styles.css / park.js / admin.js）
├─ build/build.mjs           # 内联打包 → dist/index.js
├─ dev/server.mjs            # 本地服务（mock EdgeKV）
├─ dev/smoke.mjs             # 端到端冒烟测试（102 项）
├─ dev/qr-check.mjs          # 二维码渲染一致性校验
└─ dist/index.js             # 部署产物
```

## 部署

> 前提：已备案域名 + 阿里云 ESA 账号。完整运维手册见 [docs/挪车码-实施计划.md](docs/挪车码-实施计划.md) 第 11 节。

1. ESA 控制台 → **KV 存储**：创建命名空间 `movecar`
2. **函数和 Pages → 创建函数**：规格选 50 ms，语言 JavaScript
3. 添加函数变量（生产环境）：`KV_NAMESPACE=movecar`、`ADMIN_SECRET=<32 字节以上随机串>`（勾选加密存储）
4. `npm run build`，把 `dist/index.js` 粘贴到函数代码编辑器
5. 先发布到测试环境验证，再绑定域名（CNAME），设置管理员密码并录入车辆
6. 下载二维码 → 手机扫码验证 → 打印车贴（直径 ≥ 3 cm）→ 发布生产

> ⚠️ 函数变量修改后需重新生成版本并发布才生效。

## 测试

```bash
npm run smoke      # 端到端冒烟测试，102 项（需先 npm run dev）
node dev/qr-check.mjs   # 二维码渲染矩阵与 qrcode-generator 逐格比对
```

覆盖：鉴权全链路、车辆 CRUD、输入校验、扫码页 HTML 不含手机号、`rev` 冲突 409、重置 ID 后旧地址失效、二维码定位图形完整性、375px 无横向溢出。

## FAQ

**为什么不用数据库/服务器？**
挪车场景是「单管理员 + 几辆车 + 极低频读写」，一个 KV 文档足够。省掉源站、数据库和运维，也符合边缘函数 4 子请求的限制。

**改完车辆多久生效？**
EdgeKV 最终一致，通常几秒，最迟 300 s。后台保存时会提示「全球节点约 5 秒~5 分钟后全部生效」。

**忘记密码怎么办？**
删除 KV 中的 `auth_admin` key，重新访问 `/admin` 初始化即可，车辆数据不受影响。

**二维码为什么是「圆底方码」？**
只有底板是圆的，二维码矩阵保持正方形——圆形裁切会切掉定位角导致扫码率骤降。圆点模块 + H 级纠错（30%）+ 充足静区保证可扫性。

**能防爬手机号吗？**
防的是批量爬取：页面 HTML 不含完整号码、点呼才取号、同 IP 每小时限 10 次。已知取舍是 KV 内号码明文、接口返回真实号码（不使用隐私号的决策下无法避免）。

## License

Private / Unlicensed（`package.json` 已标记 `private: true`）。
