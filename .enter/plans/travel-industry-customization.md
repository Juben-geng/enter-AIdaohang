# 旅游行业AI工具导航 - 完整定制方案

## 📋 变更背景

将"智联导航中心"改造为**旅游行业B端旅行社AI工具导航平台**，针对旅行社业务场景提供：
- 旅游行业专属品牌形象
- 预设旅游工具分类和链接
- 旅游场景AI功能（行程规划、景点推荐、攻略生成）
- B端功能（客户管理、团队协作、订单管理）
- 白标定制系统（让旅行社客户自定义品牌）

## 🎯 实施策略

采用**4阶段渐进式开发**，每阶段可独立验收：

---

## 📦 Phase 1: 品牌升级与旅游主题改造（基础层）

### 1.1 品牌视觉系统

**配色方案**（旅游行业色彩心理学）：
- **主色**：海洋蓝 `#1E88E5`（信任、专业、广阔）
- **辅色**：阳光橙 `#FF9800`（活力、热情、探索）
- **点缀色**：自然绿 `#4CAF50`（生态、健康、和谐）
- **中性色**：保留现有灰度系统

**Logo与图标**：
- 主图标：`Plane`（飞机）+ `MapPin`（地标）组合
- Slogan：「AI赋能，智慧旅游」

**修改文件**：
```
src/index.css (配色方案)
tailwind.config.ts (扩展旅游主题色)
```

### 1.2 品牌文案更新

**全局替换**：
- "智联导航中心" → "旅游AI工具导航"
- "欢迎使用智联导航" → "欢迎来到智慧旅游平台"

**修改文件**：
```
src/pages/Auth.tsx
src/pages/DashboardAnonymous.tsx
src/components/TutorialVideo.tsx
src/contexts/AuthContext.tsx
index.html (<title>标签)
```

### 1.3 职业标签调整

将profession_tags改为旅游细分场景：
- 出境游 🌍
- 国内游 🏞️
- 定制游 ✨
- 团队游 👥
- 自由行 🎒
- 亲子游 👨‍👩‍👧‍👦
- 蜜月游 💑

**数据库迁移**：
```sql
-- 清空并重新插入旅游行业职业标签
TRUNCATE profession_tags CASCADE;
INSERT INTO profession_tags (name, icon, sort_order) VALUES
  ('出境游', '🌍', 1),
  ('国内游', '🏞️', 2),
  ('定制游', '✨', 3),
  ...
```

---

## 📦 Phase 2: 旅游工具预设分类（内容层）

### 2.1 预设工具分类

创建旅游行业标准分类：

| 分类名称 | 图标 | 包含工具示例 |
|---------|------|-------------|
| 行程规划 | 📋 | Notion、Trello、飞书文档 |
| 签证服务 | 🛂 | 携程签证、途牛签证助手 |
| 酒店预订 | 🏨 | Booking、Agoda、携程酒店 |
| 机票查询 | ✈️ | 去哪儿、携程机票、飞猪 |
| 景点门票 | 🎫 | 美团、大众点评、驴妈妈 |
| 租车服务 | 🚗 | 神州租车、一嗨租车 |
| 翻译工具 | 🌐 | DeepL、谷歌翻译、有道 |
| 攻略参考 | 📚 | 马蜂窝、穷游、小红书 |

### 2.2 数据库迁移

```sql
-- 创建预设分类和链接表
CREATE TABLE IF NOT EXISTS preset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER,
  industry TEXT DEFAULT 'travel',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preset_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES preset_categories(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入预设数据（示例）
INSERT INTO preset_categories (name, icon, color, sort_order) VALUES
  ('行程规划', '📋', '#1E88E5', 1),
  ('签证服务', '🛂', '#FF9800', 2),
  ('酒店预订', '🏨', '#4CAF50', 3),
  ...;
```

### 2.3 初始化逻辑

**新用户自动复制预设分类**：
- 注册时自动将`preset_categories`和`preset_links`复制到用户的`categories`和`links`表
- 修改`AuthContext.tsx`的`handle_new_user()`触发器

---

## 📦 Phase 3: AI功能集成（智能层）

### 3.1 旅游场景AI功能

利用现有AI能力配置（`coding.ai.*`），创建3个核心功能：

#### A. 行程规划助手
**Edge Function**: `travel-itinerary-generator`
```typescript
// 输入：目的地、天数、预算、兴趣标签
// 输出：结构化行程表（Day-by-Day）
// AI Model: Claude Sonnet 4.5（复杂推理）
```

#### B. 景点推荐引擎
**Edge Function**: `attraction-recommender`
```typescript
// 输入：位置、用户偏好、季节
// 输出：Top 10景点列表 + 理由
// AI Model: Gemini 3 Pro（快速响应）
```

#### C. 旅游攻略生成
**Edge Function**: `travel-guide-generator`
```typescript
// 输入：目的地、主题（美食/购物/亲子）
// 输出：长文攻略（Markdown格式）
// AI Model: Claude Sonnet 4.5
```

### 3.2 前端页面

创建AI工具专区：
```
src/pages/ai/
  ├── ItineraryPlanner.tsx（行程规划）
  ├── AttractionRecommender.tsx（景点推荐）
  └── GuideGenerator.tsx（攻略生成）
```

### 3.3 权限控制

- **免费用户**：无AI功能
- **普通会员**：每月3次AI调用
- **VIP会员**：无限AI调用

---

## 📦 Phase 4: B端功能扩展（企业层）

### 4.1 客户管理系统（CRM）

**数据库设计**：
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES profiles(id), -- 所属旅行社
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  wechat TEXT,
  tags TEXT[], -- 标签：['高端客户', '回头客']
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  destination TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT, -- 'inquiry', 'confirmed', 'completed'
  budget NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**前端页面**：
```
src/pages/crm/
  ├── CustomerList.tsx（客户列表）
  ├── CustomerDetail.tsx（客户详情）
  └── TripManagement.tsx（行程管理）
```

### 4.2 团队协作

**数据库设计**：
```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  plan TEXT DEFAULT 'free', -- 'free', 'team', 'enterprise'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT, -- 'owner', 'admin', 'member'
  permissions JSONB, -- {'crm': true, 'orders': false}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**功能特性**：
- 团队成员管理
- 权限分配（查看/编辑/删除）
- 数据共享（共享客户库、行程模板）

### 4.3 订单管理

**数据库设计**：
```sql
CREATE TABLE travel_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL, -- 订单号
  agency_id UUID REFERENCES agencies(id),
  customer_id UUID REFERENCES customers(id),
  trip_id UUID REFERENCES customer_trips(id),
  status TEXT, -- 'pending', 'paid', 'cancelled'
  total_amount NUMERIC,
  paid_amount NUMERIC,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES travel_orders(id),
  item_type TEXT, -- 'flight', 'hotel', 'ticket', 'guide'
  item_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC,
  subtotal NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**前端页面**：
```
src/pages/orders/
  ├── OrderList.tsx（订单列表）
  ├── OrderDetail.tsx（订单详情）
  └── OrderCreate.tsx（创建订单）
```

### 4.4 白标定制系统

**数据库设计**：
```sql
CREATE TABLE whitelabel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID UNIQUE REFERENCES agencies(id),
  brand_name TEXT, -- 自定义品牌名
  logo_url TEXT, -- 自定义Logo URL
  primary_color TEXT, -- 主题色 #HEX
  slogan TEXT, -- 自定义Slogan
  domain TEXT, -- 自定义域名（可选）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**实现逻辑**：
- 检测访问域名或query参数`?agency=xxx`
- 加载对应agency的`whitelabel_configs`
- 动态应用CSS变量和品牌元素
- 创建`src/contexts/WhiteLabelContext.tsx`统一管理

**前端组件**：
```
src/pages/settings/
  └── WhiteLabelSettings.tsx（白标配置页面）

src/contexts/
  └── WhiteLabelContext.tsx（白标上下文）

src/components/
  └── DynamicBrand.tsx（动态品牌组件）
```

---

## 🗂️ 关键文件清单

### 需要修改的文件

**品牌相关**：
- `src/index.css` - 旅游主题配色
- `tailwind.config.ts` - 扩展颜色系统
- `index.html` - 更新页面标题
- `src/pages/Auth.tsx` - 品牌文案
- `src/pages/DashboardAnonymous.tsx` - 欢迎语
- `src/components/TutorialVideo.tsx` - 教程视频内容

**数据结构**：
- `src/contexts/AuthContext.tsx` - 新用户初始化逻辑
- `supabase/migrations/migration_*.sql` - 新建数据表

**路由配置**：
- `src/router.tsx` - 添加AI/CRM/订单路由

### 需要创建的文件

**AI功能**：
- `src/pages/ai/ItineraryPlanner.tsx`
- `src/pages/ai/AttractionRecommender.tsx`
- `src/pages/ai/GuideGenerator.tsx`
- `supabase/functions/travel-itinerary-generator/index.ts`
- `supabase/functions/attraction-recommender/index.ts`
- `supabase/functions/travel-guide-generator/index.ts`

**B端功能**：
- `src/pages/crm/CustomerList.tsx`
- `src/pages/crm/CustomerDetail.tsx`
- `src/pages/crm/TripManagement.tsx`
- `src/pages/orders/OrderList.tsx`
- `src/pages/orders/OrderDetail.tsx`
- `src/pages/orders/OrderCreate.tsx`
- `src/pages/settings/WhiteLabelSettings.tsx`

**上下文**：
- `src/contexts/WhiteLabelContext.tsx`
- `src/contexts/AgencyContext.tsx`

**组件**：
- `src/components/DynamicBrand.tsx`
- `src/components/crm/CustomerCard.tsx`
- `src/components/orders/OrderCard.tsx`

---

## ✅ 验证方案

### Phase 1 验证
- [ ] 首页显示"旅游AI工具导航"品牌
- [ ] 配色为海洋蓝+阳光橙主题
- [ ] 职业标签改为旅游场景

### Phase 2 验证
- [ ] 新注册用户自动获得8个预设分类
- [ ] 每个分类包含3-5个常用工具链接
- [ ] 可手动删除或编辑预设内容

### Phase 3 验证
- [ ] VIP用户可访问AI工具页面
- [ ] 输入"北京5日游"生成完整行程
- [ ] 输入"上海美食"生成美食攻略

### Phase 4 验证
- [ ] 创建客户资料并添加行程
- [ ] 创建订单并关联客户
- [ ] 配置白标品牌后刷新页面看到自定义Logo

---

## 🎛️ 配置项

### 会员权限矩阵

| 功能 | 免费 | 普通 | VIP | 城市代理 |
|------|------|------|-----|---------|
| 预设分类 | ✅ | ✅ | ✅ | ✅ |
| 自定义分类 | 10个 | 20个 | 50个 | 无限 |
| AI行程规划 | ❌ | 3次/月 | 无限 | 无限 |
| AI景点推荐 | ❌ | 3次/月 | 无限 | 无限 |
| AI攻略生成 | ❌ | 3次/月 | 无限 | 无限 |
| 客户管理 | ❌ | 100个 | 500个 | 无限 |
| 团队协作 | ❌ | ❌ | 5人 | 20人 |
| 订单管理 | ❌ | ❌ | ✅ | ✅ |
| 白标定制 | ❌ | ❌ | ❌ | ✅ |

---

## 📈 实施优先级建议

**MVP最小可行版本**（2周）：
1. Phase 1（品牌改造）- 2天
2. Phase 2（预设分类）- 3天

**标准版本**（4周）：
+ Phase 3（AI功能）- 1周

**企业完整版**（8周）：
+ Phase 4（B端功能）- 2周

---

## 🔧 技术依赖

**已有**：
- ✅ Supabase（数据库 + Auth + Edge Functions）
- ✅ AI Capability（text-to-text, image-generation, video-generation）
- ✅ @dnd-kit（拖拽排序）
- ✅ React Hook Form + Zod（表单验证）

**需要新增**：
- 📦 `recharts`（已安装 - 用于数据图表）
- 📦 `date-fns`（已安装 - 日期处理）

---

## 💡 关键设计决策

### 1. 预设分类 vs 用户自定义
**决策**：注册时复制预设分类到用户表，允许用户修改/删除
**原因**：给新用户即用体验，同时保持灵活性

### 2. AI功能按调用次数计费
**决策**：普通会员每月3次免费调用，VIP无限
**原因**：平衡成本与用户体验，引导升级

### 3. 白标系统实现方式
**决策**：CSS变量 + 动态加载，避免多实例部署
**原因**：降低运维成本，简化架构

### 4. B端功能权限控制
**决策**：基于角色（owner/admin/member）+ 功能权限（JSONB）
**原因**：灵活的权限体系，支持复杂场景

---

## 🚀 下一步行动

1. **用户确认**：确认实施优先级（MVP/标准/完整版）
2. **开始Phase 1**：品牌改造（2天完成）
3. **逐步推进**：每完成一个Phase验收后再进入下一个

