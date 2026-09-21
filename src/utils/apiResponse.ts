// src/utils/apiResponse.ts
//
// The backend reports business failures (validation, duplicates, not found)
// as an HTTP 200 whose body carries a non-"200" `Code` and a `Message`. The
// Java app checks `Code` on every mutation; apiClient only rejects the
// "999"/"888" codes, so mutation call sites wrap their response in this to
// turn any other failure code into a thrown Error carrying the server message.

const SUCCESS_CODES = ['200', '201'];

export const ensureSuccess = <T>(response: T, fallbackMessage = 'Request failed'): T => {
  const body = response as { Code?: unknown; Message?: unknown } | null | undefined;
  const code = body?.Code;
  if (code !== undefined && code !== null && !SUCCESS_CODES.includes(String(code))) {
    const message = typeof body?.Message === 'string' && body.Message.trim() ? body.Message : fallbackMessage;
    throw new Error(message);
  }
  return response;
};
