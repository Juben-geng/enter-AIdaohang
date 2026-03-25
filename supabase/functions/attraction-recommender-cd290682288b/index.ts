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

    const { location, preferences, season, days } = await req.json();

    const prompt = `你是一位资深旅游顾问。请根据以下信息，为游客推荐最合适的景点：

位置：${location}
游玩天数：${days || '不限'}天
偏好类型：${preferences}
旅行季节：${season || '当前季节'}

请按照以下格式输出Top 10景点推荐：

# ${location}必游景点推荐

## 景点1：[景点名称] ⭐⭐⭐⭐⭐
**类型**：[自然风光/历史文化/主题乐园/美食街区等]
**推荐指数**：5/5
**推荐理由**：（为什么推荐此景点，与用户偏好的匹配点）
**游玩时长**：约X小时
**最佳游览时间**：（具体时段）
**门票价格**：XXX元
**交通方式**：如何到达
**实用贴士**：（游玩建议、拍照点、避坑指南）

（按此格式推荐10个景点，按推荐指数排序）

## 行程规划建议
根据您的${days || ''}天行程，建议以下游览顺序：
- Day 1：[景点组合]
- Day 2：[景点组合]
...

## 季节特色
在${season || '当前季节'}游览${location}的特别之处...

请确保推荐的景点符合用户偏好，并提供实用的游玩建议。`;

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
        model: "google/gemini-3.1-pro-preview",
        messages,
        stream: true,
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
