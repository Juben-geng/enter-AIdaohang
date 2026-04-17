# 职业标签功能设置指南

## ✅ 已完成的工作

### 1. 数据库表创建
- ✅ `profession_tags` - 职业标签配置表
- ✅ `user_profession_tags` - 用户标签选择记录表
- ✅ `profession_popup_history` - 弹窗历史记录表
- ✅ RLS策略已配置

### 2. 组件创建
- ✅ `ProfessionTagDialog.tsx` - 职业标签选择弹窗
- ✅ `useProfessionTagPopup.ts` - 弹窗逻辑Hook

### 3. 集成到主界面
- ✅ 导入到 DashboardAnonymous.tsx
- ✅ Hook已添加
- ✅ 弹窗组件已添加

## 🔧 需要手动执行的步骤

### 步骤1: 插入初始职业标签数据

由于supabase_insert工具限制，需要手动在Enter Cloud控制台执行：

```sql
INSERT INTO profession_tags (name, category, display_order, is_active) VALUES
('旅行社', 'travel_agency', 1, true),
('酒店管理', 'hotel', 2, true),
('景区运营', 'attraction', 3, true),
('交通运输', 'transport', 4, true),
('导游领队', 'guide', 5, true),
('旅游策划', 'planning', 6, true),
('市场营销', 'marketing', 7, true),
('客户服务', 'service', 8, true),
('在线旅游平台', 'ota', 9, true),
('其他旅游从业者', 'other', 10, true);
```

**执行方法**:
1. 打开浏览器开发者工具 (F12)
2. 进入Console标签
3. 粘贴以下JavaScript代码并回车:

```javascript
// 使用Supabase客户端插入数据
const tags = [
  {name: '旅行社', category: 'travel_agency', display_order: 1, is_active: true},
  {name: '酒店管理', category: 'hotel', display_order: 2, is_active: true},
  {name: '景区运营', category: 'attraction', display_order: 3, is_active: true},
  {name: '交通运输', category: 'transport', display_order: 4, is_active: true},
  {name: '导游领队', category: 'guide', display_order: 5, is_active: true},
  {name: '旅游策划', category: 'planning', display_order: 6, is_active: true},
  {name: '市场营销', category: 'marketing', display_order: 7, is_active: true},
  {name: '客户服务', category: 'service', display_order: 8, is_active: true},
  {name: '在线旅游平台', category: 'ota', display_order: 9, is_active: true},
  {name: '其他旅游从业者', category: 'other', display_order: 10, is_active: true}
];

// 执行插入（需要在页面已加载Supabase客户端的情况下）
async function insertTags() {
  const { data, error } = await window.supabase
    .from('profession_tags')
    .insert(tags);
  
  if (error) {
    console.error('插入失败:', error);
  } else {
    console.log('✅ 职业标签初始数据插入成功！');
  }
}

insertTags();
```

## 🧪 测试步骤

### 测试1: 新用户首次登录
1. 创建一个新测试账号
2. 登录后应该立即弹出职业标签选择框
3. 选择1-3个标签
4. 点击"保存"
5. 弹窗应该关闭且不再显示

### 测试2: 已选择用户
1. 使用已选择职业标签的账号登录
2. 应该不显示职业标签弹窗
3. 正常使用系统功能

### 测试3: 未选择用户（频次控制）
1. 新建账号
2. 登录后弹出弹窗
3. 点击"稍后再说"或关闭
4. 刷新页面 - 不应显示（3天内不显示）
5. 修改数据库shown_at为4天前
6. 刷新页面 - 应该显示
7. 再次点击"稍后再说"
8. 修改shown_at为4天前
9. 刷新页面 - 应该显示（第2次）
10. 再次点击"稍后再说"
11. 修改shown_at为4天前  
12. 刷新页面 - 不应显示（本周已2次）

### 测试4: 管理员查看统计
1. 使用管理员账号 (jygxb2464@163.com) 登录
2. 在数据库中查询:
```sql
-- 查看所有用户的职业标签选择
SELECT 
  p.email,
  pt.name as tag_name,
  upt.selected_at
FROM user_profession_tags upt
JOIN profiles p ON p.id = upt.user_id
JOIN profession_tags pt ON pt.id = upt.profession_tag_id
ORDER BY upt.selected_at DESC;

-- 查看弹窗显示历史
SELECT 
  p.email,
  pph.shown_at,
  pph.action
FROM profession_popup_history pph
JOIN profiles p ON p.id = pph.user_id
ORDER BY pph.shown_at DESC;

-- 统计每个职业标签的选择人数
SELECT 
  pt.name,
  COUNT(upt.user_id) as user_count
FROM profession_tags pt
LEFT JOIN user_profession_tags upt ON upt.profession_tag_id = pt.id
GROUP BY pt.id, pt.name
ORDER BY user_count DESC;
```

## 📊 预期效果

### UI展示:
- ✅ 弹窗居中显示
- ✅ 10个职业标签Badge样式
- ✅ 选中标签高亮显示
- ✅ 未选中标签灰色outline
- ✅ 已选择数量提示
- ✅ 友好的说明文字
- ✅ 两个操作按钮：稍后再说、保存

### 逻辑控制:
- ✅ 新用户首次必显示
- ✅ 已选择用户不显示
- ✅ 未选择用户每周最多2次
- ✅ 至少间隔3天显示
- ✅ 记录所有用户操作

## 🔍 调试方法

### 查看Hook状态:
在浏览器Console中:
```javascript
// 查看当前用户是否应该显示弹窗
console.log('shouldShow:', shouldShowProfessionTag);
```

### 查看数据库数据:
```sql
-- 查看职业标签表
SELECT * FROM profession_tags;

-- 查看当前用户的选择
SELECT * FROM user_profession_tags WHERE user_id = '当前用户ID';

-- 查看弹窗历史
SELECT * FROM profession_popup_history WHERE user_id = '当前用户ID' ORDER BY shown_at DESC;
```

### 强制显示弹窗（调试用）:
在浏览器Console中:
```javascript
// 临时强制显示（刷新后失效）
setShouldShowProfessionTag(true);
```

### 清除历史记录（重新测试）:
```sql
-- 删除用户的所有职业标签相关数据
DELETE FROM user_profession_tags WHERE user_id = '测试用户ID';
DELETE FROM profession_popup_history WHERE user_id = '测试用户ID';
```

## ⚠️ 注意事项

1. **首次使用必须插入初始数据** - 否则弹窗是空的
2. **Hook依赖user和profile** - 确保已登录
3. **RLS策略已配置** - 用户只能操作自己的数据
4. **管理员有特殊权限** - 可以查看所有用户数据
5. **频次控制是软限制** - 用户可以手动关闭

## 🎯 后续优化建议

1. **管理后台页面** - 创建专门的职业标签统计页面
2. **推荐算法** - 根据职业标签推荐相关内容
3. **标签管理** - 允许管理员添加/编辑职业标签
4. **数据分析** - 分析不同职业的用户行为
5. **自定义标签** - 允许用户添加自定义职业

## ✅ 完成状态

- ✅ 数据库表结构完成
- ✅ RLS策略配置完成
- ✅ 前端组件完成
- ✅ Hook逻辑完成
- ✅ 集成到主界面完成
- ⏳ 初始数据需手动插入
- ⏳ 测试验证待执行

