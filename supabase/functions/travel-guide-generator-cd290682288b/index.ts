import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_cd290682288b");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

    const { destination, theme } = await req.json();

    const prompt = `你是一位经验丰富的旅游攻略作者。请为${destination}撰写一份详细的${theme}主题旅游攻略。

要求：
1. 内容丰富详实，包含实用信息
2. 结构清晰，易于阅读
3. 提供个人化建议和避坑指南
4. 包含预算参考和时间规划

请按照以下Markdown格式输出：

# ${destination}${theme}完全攻略

## 📍 目的地概况
- **最佳旅行时间**：
- **建议游玩天数**：
- **人均预算**：
- **语言与货币**：
- **时差**：

## 🎯 ${theme}亮点
### 必打卡地点Top 5
1. **[地点名]**
   - 特色：
   - 推荐理由：
   - 开放时间：
   - 门票价格：

（列出5个必打卡地点）

## 🚗 交通攻略
### 如何到达${destination}
- 国际航班：
- 国内交通：
- 市内交通：
  - 地铁/公交
  - 出租车/网约车
  - 租车自驾

### 交通卡/票务建议

## 🏨 住宿推荐
### 按区域划分
**市中心区域**
- 优点：
- 酒店推荐：
- 价格区间：

**[其他区域]**
（类似格式）

## 🍜 ${theme}美食推荐
### 必吃美食清单
1. **[美食名称]**
   - 推荐餐厅：
   - 人均消费：
   - 必点菜品：
   - 地址：

（列出至少8种美食）

## 📝 详细行程规划
### 3日游行程
**Day 1：[主题]**
- 09:00 - 10:30：[活动]
- 10:30 - 12:00：[活动]
（详细时间规划）

**Day 2-3：** （类似格式）

### 5日游行程
（如适用）

## 💰 预算参考
### 经济型（人均XXX元）
- 住宿：
- 餐饮：
- 交通：
- 门票：
- 其他：

### 舒适型（人均XXX元）
（类似格式）

### 豪华型（人均XXX元）
（类似格式）

## ⚠️ 实用贴士
### 必带物品
- 证件类：
- 衣物类：
- 电子设备：
- 其他：

### 注意事项
1. 天气特点：
2. 安全提醒：
3. 文化禁忌：
4. 消费习惯：
5. 紧急联系方式：

### 省钱攻略
- 订票建议：
- 餐饮省钱：
- 交通省钱：
- 门票优惠：

### 避坑指南
1. **[常见陷阱1]**
   - 如何识别：
   - 如何避免：

（列出5-8个常见陷阱）

## 📸 拍照打卡指南
### 最佳拍摄点
1. **[地点名]**
   - 最佳时间：
   - 拍摄角度：
   - 推荐滤镜：

（列出至少5个）

## 🎁 购物与纪念品
### 特色商品
- [商品1]：购买地点、价格区间
- [商品2]：购买地点、价格区间

### 购物区域推荐

## 📞 紧急联系方式
- 中国驻${destination}使领馆：
- 当地报警电话：
- 旅游投诉电话：
- 医疗救助：

---

**攻略更新时间**：[当前日期]
**作者寄语**：祝您在${destination}有一段美好的${theme}之旅！

请确保攻略内容实用、详尽，并包含最新的旅游信息。`;

    const messages = [
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages,
        stream: true,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = "AI service error";
      let errorCode = "api_error";
      
      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        try {
          const errorData = JSON.parse(dataMatch[1]);
          errorMessage = errorData.error?.message || errorMessage;
          errorCode = errorData.error?.type || errorCode;
        } catch { /* use defaults */ }
      }
      
      const errorSSE = `event: error\ndata: ${JSON.stringify({
        type: "error",
        error: { type: errorCode, message: errorMessage }
      })}\n\n`;
      
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorSSE = `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "api_error", message: error.message }
    })}\n\n`;
    
    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });
  }
});
