import { ApiError, ApiErrorResponse, DownloadResult } from './types';
import { extractFilenameFromContentDisposition } from './download';

/**
 * 응답 객체로부터 에러 본문을 파싱하여 ApiError 또는 Error를 생성합니다.
 */
async function handleResponseError(response: Response): Promise<never> {
  const contentType = response.headers?.get?.('content-type') || '';

  if (contentType.includes('application/json') || !response.headers) {
    try {
      const errorJson = (await response.json()) as Partial<ApiErrorResponse>;
      if (errorJson && typeof errorJson.code === 'string') {
        throw new ApiError(errorJson as ApiErrorResponse);
      }
      if (errorJson && typeof errorJson.message === 'string' && errorJson.message) {
        throw new Error(errorJson.message);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e instanceof Error && !contentType.includes('text/')) {
        // response.json()에서 명시적으로 생성된 Error인 경우 그대로 전달
        if (e.message && !(e instanceof SyntaxError)) {
          throw e;
        }
      }
      // JSON 파싱 실패 시 아래 기본 에러로 진행
    }
  }

  // 텍스트 기반 에러 메시지 추출 시도
  let errorText = '';
  try {
    if (typeof response.text === 'function') {
      errorText = await response.text();
    }
  } catch {
    // 무시
  }

  throw new Error(
    errorText || `HTTP 요청 실패: ${response.status ?? ''} ${response.statusText ?? ''}`.trim(),
  );
}

/**
 * 동일 Origin 세션 쿠키를 포함하여 GET 요청을 수행하고 JSON 응답을 반환합니다.
 */
export async function getJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return (await response.json()) as T;
}

/**
 * JSON 본문을 전송하고 JSON 응답을 반환하는 공통 요청 헬퍼
 */
async function requestJson<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  url: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return (await response.json()) as T;
}

/**
 * JSON 본문을 전송하고 JSON 응답을 받는 POST 요청
 */
export async function postJson<T>(
  url: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return requestJson<T>('POST', url, body, init);
}

/**
 * JSON 본문을 전송하고 JSON 응답을 받는 PUT 요청
 */
export async function putJson<T>(
  url: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return requestJson<T>('PUT', url, body, init);
}

/**
 * JSON 본문을 전송하고 JSON 응답을 받는 PATCH 요청
 */
export async function patchJson<T>(
  url: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return requestJson<T>('PATCH', url, body, init);
}

/**
 * 리소스를 삭제하는 DELETE 요청
 */
export async function deleteRequest(
  url: string,
  init?: RequestInit,
): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    await handleResponseError(response);
  }
}

/**
 * FormData를 전송하고 JSON 응답을 받는 POST 요청
 */
export async function postFormData<T>(
  url: string,
  formData: FormData,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    ...init,
    headers: {
      // multipart/form-data는 브라우저가 boundary를 자동으로 설정하도록 Content-Type을 수동 지정하지 않음
      ...init?.headers,
    },
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  return (await response.json()) as T;
}

/**
 * FormData를 전송하고 바이너리 파일(Blob)을 다운로드하는 POST 요청
 */
export async function downloadBlob(
  url: string,
  formData: FormData,
  fallbackFilename: string,
  init?: RequestInit,
): Promise<DownloadResult> {
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  const contentDisposition = response.headers.get('content-disposition');
  const filename = extractFilenameFromContentDisposition(
    contentDisposition,
    fallbackFilename,
  );
  const blob = await response.blob();

  return { blob, filename };
}
