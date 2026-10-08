export const LOCAL_CONNECTION_ERROR =
  "浏览器未能取得 FrontierLens 服务的响应。请刷新页面，并检查服务、3040 端口转发及浏览器代理连接。此错误不能判断 API Key 是否有效；保存或提交任务后遇到此错误，请先刷新确认状态，不要反复提交。";

export async function localFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch (error) {
    if (init?.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new Error(LOCAL_CONNECTION_ERROR);
    }
    throw error;
  }
}
