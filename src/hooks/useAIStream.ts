import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

interface UseAIStreamOptions {
  functionName: string;
  onComplete?: (content: string) => void;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  authentication_error: '认证失败，请刷新页面重试',
  rate_limit_error: '请求过于频繁，请稍后再试',
  invalid_request_error: '请求格式错误，请修改后重试',
  overloaded_error: '服务繁忙，请稍后再试',
  insufficient_credits: 'AI额度已用完，请联系管理员',
  permission_error: 'AI功能未启用，请联系管理员',
  api_error: '服务暂时不可用',
};

function getUserErrorMessage(code: string, backendMessage: string): string {
  if (backendMessage) {
    return backendMessage;
  }
  return FALLBACK_MESSAGES[code] || '服务暂时不可用';
}

export function useAIStream({ functionName, onComplete }: UseAIStreamOptions) {
  const [content, setContent] = useState('');
  const [thinking, setThinking] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (payload: Record<string, unknown>) => {
    abortControllerRef.current = new AbortController();

    setContent('');
    setThinking('');
    setError(null);
    setIsStreaming(true);

    const blocks = new Map<number, { type: string; content: string }>();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || SUPABASE_PUBLISHABLE_KEY;

      await fetchEventSource(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,

        async onopen(response) {
          const contentType = response.headers.get('content-type');

          if (!response.ok) {
            if (contentType?.includes('text/event-stream')) {
              const text = await response.text();
              const dataMatch = text.match(/data: (.+)/);
              if (dataMatch) {
                try {
                  const errorData = JSON.parse(dataMatch[1]);
                  if (errorData.type === 'error' && errorData.error?.message) {
                    throw new Error(errorData.error.message);
                  }
                } catch (parseError) {
                  if (parseError instanceof Error && parseError.message !== 'Unexpected token') {
                    throw parseError;
                  }
                }
              }
            }

            if (contentType?.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.error?.message || errorData.error || `Request failed: ${response.status}`);
            }

            throw new Error(`Request failed: ${response.status}`);
          }

          if (!contentType?.includes('text/event-stream')) {
            throw new Error(`Expected text/event-stream, got: ${contentType}`);
          }
        },

        onmessage(event) {
          if (!event.data) return;
          const data = JSON.parse(event.data);

          if (data.type === 'error') {
            const errorMsg = getUserErrorMessage(
              data.error?.type || 'api_error',
              data.error?.message || 'Service error'
            );
            setError(errorMsg);
            setIsStreaming(false);
            return;
          }

          switch (data.type) {
            case 'content_block_start': {
              blocks.set(data.index, { type: data.content_block.type, content: '' });
              break;
            }
            case 'content_block_delta': {
              const block = blocks.get(data.index);
              if (block?.type === 'thinking') {
                block.content += data.delta.thinking || '';
                setThinking(block.content);
              } else if (block?.type === 'text') {
                block.content += data.delta.text || '';
                setContent(block.content);
              }
              break;
            }
            case 'message_stop': {
              setIsStreaming(false);
              const finalContent = Array.from(blocks.values())
                .find(b => b.type === 'text')?.content || '';
              onComplete?.(finalContent);
              break;
            }
          }
        },

        onerror(err) {
          throw err;
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || '生成失败，请重试');
      }
      setIsStreaming(false);
    }
  }, [functionName, onComplete]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    content,
    thinking,
    isStreaming,
    error,
    generate,
    cancel,
  };
}
