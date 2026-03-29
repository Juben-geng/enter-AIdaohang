import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  prompt: string;
  type?: "txt_2_video";
  ratio?: string;
  duration?: number;
  format?: string;
}

function errorResponse(status: number, message: string, code: string) {
  console.error(`[AI Video Error] ${code}: ${message}`);
  return new Response(
    JSON.stringify({ success: false, message, code }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_cd290682288b");
    if (!AI_API_TOKEN) {
      return errorResponse(500, "AI service is not configured", "configuration_error");
    }

    const body: VideoRequest = await req.json();
    const { prompt, type = "txt_2_video", ratio, duration, format } = body;

    if (!prompt) {
      return errorResponse(400, "请输入视频描述", "invalid_request_error");
    }

    const video_option: Record<string, string | number> = {};
    if (ratio) video_option.ratio = ratio;
    if (duration) video_option.duration = duration;
    if (format) video_option.format = format;

    console.log(`[AI Video] Submitting video generation: ${prompt.substring(0, 50)}...`);

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/videos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
        "X-Async": "true",
      },
      body: JSON.stringify({
        model: "doubao/seedance-1.0-pro",
        prompt,
        type,
        video_option,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || "AI service error";
      const code = errorData.error?.type || "api_error";
      return errorResponse(response.status, message, code);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        task_id: data.task_id, 
        status: "processing" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return errorResponse(500, error.message || "Internal error", "internal_error");
  }
});
