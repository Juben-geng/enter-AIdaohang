import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageRequest {
  prompt: string;
  type?: "txt_2_img";
  ratio?: string;
  resolution?: string;
  format?: string;
}

interface ImageMetaData {
  url?: string;
  [key: string]: unknown;
}

interface ImageResult {
  url: string;
  meta_data?: ImageMetaData;
}

interface Resource {
  url?: string;
  meta_data?: ImageMetaData;
}

interface ParsedPayload {
  resources?: Resource[];
  [key: string]: unknown;
}

function parseErrorCode(type: string, message: string): string {
  if (type !== "api_error") return type;
  
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("insufficient credits")) return "insufficient_credits";
  if (lowerMsg.includes("disabled")) return "permission_error";
  if (lowerMsg.includes("rate limit")) return "rate_limit_error";
  if (lowerMsg.includes("timeout")) return "overloaded_error";
  
  return type;
}

function errorResponse(status: number, message: string, code: string) {
  console.error(`[AI Image Error] ${code}: ${message}`);
  return new Response(
    JSON.stringify({ success: false, message, code }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function successResponse(images: ImageResult[], taskId: string) {
  return new Response(
    JSON.stringify({ success: true, images, task_id: taskId }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function parseRespPayload(respPayload: string): ImageResult[] {
  try {
    const payload = JSON.parse(respPayload) as ParsedPayload;
    const resources = payload.resources || [];
    return resources.map((r: Resource) => ({
      url: r.url || r.meta_data?.url || '',
      meta_data: r.meta_data
    }));
  } catch (e) {
    console.error("[AI Image] Failed to parse resp_payload:", e);
    return [];
  }
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

    const body: ImageRequest = await req.json();
    const { prompt, type = "txt_2_img", ratio, resolution, format } = body;

    if (!prompt) {
      return errorResponse(400, "请输入图片描述", "invalid_request_error");
    }

    const image_option: Record<string, string> = {};
    if (ratio) image_option.ratio = ratio;
    if (resolution) image_option.resolution = resolution;
    if (format) image_option.format = format;

    const requestBody: Record<string, unknown> = {
      model: "doubao/seedream-4.5",
      prompt,
      type,
      image_option,
    };

    console.log(`[AI Image] Generating image: ${prompt.substring(0, 50)}...`);

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || "AI service error";
      const rawCode = errorData.error?.type || "api_error";
      const code = parseErrorCode(rawCode, message);
      return errorResponse(response.status, message, code);
    }

    const data = await response.json();
    
    if (data.status === "failed") {
      return errorResponse(500, data.error || "Generation failed", "api_error");
    }

    let images: ImageResult[] = [];
    
    if (data.resp_payload) {
      images = parseRespPayload(data.resp_payload);
    } else if (data.images) {
      images = data.images;
    }

    return successResponse(images, data.task_id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    return errorResponse(500, errorMessage, "internal_error");
  }
});
