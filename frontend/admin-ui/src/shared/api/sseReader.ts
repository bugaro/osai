const SSE_DATA_PREFIX = 'data: ';
const SSE_DONE_SENTINEL = '[DONE]';
const SSE_COMMENT_PREFIX = ':';
const SSE_READER_TAG = '[sseReader]';

export async function* readSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.trim() === '') continue;

        if (line.startsWith(SSE_COMMENT_PREFIX)) continue;

        if (line.startsWith(SSE_DATA_PREFIX)) {
          const payload = line.slice(SSE_DATA_PREFIX.length);

          if (payload.trim() === '') continue;

          if (payload.trim() === SSE_DONE_SENTINEL) return;

          yield payload;
        } else {
          console.warn(SSE_READER_TAG + ' malformed line:', line);
        }
      }
    }

    if (buffer.trim() !== '') {
      if (buffer.startsWith(SSE_DATA_PREFIX)) {
        const payload = buffer.slice(SSE_DATA_PREFIX.length);
        if (payload.trim() !== '' && payload.trim() !== SSE_DONE_SENTINEL) {
          yield payload;
        }
      } else if (!buffer.startsWith(SSE_COMMENT_PREFIX)) {
        console.warn(SSE_READER_TAG + ' malformed line:', buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
