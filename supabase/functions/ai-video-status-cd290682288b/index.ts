import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function errorResponse(status: number, message: string, code: string) {
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

    const { task_id } = await req.json();
    if (!task_id) {
      return errorResponse(400, "Missing task_id", "invalid_request_error");
    }

    const response = await fetch(
      `https://api.enter.pro/code/api/v1/ai/tasks/${task_id}`,
      {
        headers: { Authorization: `Bearer ${AI_API_TOKEN}` },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return errorResponse(
        response.status,
        errorData.error?.message || "Failed to query status",
        errorData.error?.type || "api_error"
      );
    }

    const data = await response.json();

    if (data.status === "succeed") {
      const videos = data.videos || [];
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          task_id, 
          status: "succeed", 
          videos 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.status === "failed") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          task_id, 
          status: "failed", 
          message: data.error || "Generation failed" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        task_id, 
        status: "processing" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return errorResponse(500, error.message || "Internal error", "internal_error");
  }
});
