import { ApiError, ApiErrorResponse, DownloadResult } from './types';
import { extractFilenameFromContentDisposition } from './download';

/**
 * 응답 객체로부터 에러 본문을 파싱하여 ApiError 또는 Error를 생성합니다.
 */
async function handleResponseError(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const errorJson = (await response.json()) as ApiErrorResponse;
      if (errorJson && typeof errorJson.code === 'string') {
        throw new ApiError(errorJson);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      // JSON 파싱 실패 시 아래 기본 에러로 진행
    }
  }

  // 텍스트 기반 에러 메시지 추출 시도
  let errorText = '';
  try {
    errorText = await response.text();
  } catch {
    // 무시
  }

  throw new Error(
    errorText || `HTTP 요청 실패: ${response.status} ${response.statusText}`,
  );
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
