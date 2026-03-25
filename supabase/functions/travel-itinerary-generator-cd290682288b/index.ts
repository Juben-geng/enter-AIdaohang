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

    const { destination, days, budget, interests } = await req.json();

    const prompt = `你是一位专业的旅游行程规划师。请根据以下信息，为客户制定一份详细的旅游行程计划：

目的地：${destination}
旅行天数：${days}天
预算范围：${budget}
兴趣偏好：${interests}

请按照以下格式输出：

# ${destination} ${days}日游行程规划

## 行程概览
（简要介绍此次旅行的特色和亮点）

## 详细行程

### Day 1：[主题]
**上午**：[活动和景点]
**午餐**：[推荐餐厅]
**下午**：[活动和景点]
**晚餐**：[推荐餐厅]
**住宿**：[酒店推荐和位置]

（按此格式列出每一天的行程）

## 预算分析
- 交通：XXX元
- 住宿：XXX元
- 餐饮：XXX元
- 门票：XXX元
- 其他：XXX元
**总计**：约XXX元

## 实用建议
- 最佳旅行时间
- 注意事项
- 必带物品
- 当地风俗禁忌

请确保行程安排合理，符合预算范围，并充分考虑兴趣偏好。`;

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
