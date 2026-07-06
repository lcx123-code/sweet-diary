// ─── 异步工具函数 ─────────────────────────────────────

/**
 * 为 Promise 添加超时，超过指定毫秒数则 reject 自定义错误信息
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`请求超时（${ms / 1000}s），请检查网络后重试`)), ms)
    ),
  ])
}

interface RetryOptions {
  /** 最大重试次数（默认 2） */
  maxRetries?: number
  /** 基础退避延迟（默认 1500ms） */
  baseDelay?: number
}

/**
 * 带指数退避的异步重试
 * - 网络错误（TypeError/FetchError）：重试
 * - 429 限速：退避至少 60 秒
 * - 其他错误（密码错误等）：不重试，直接抛出
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const { maxRetries = 2, baseDelay = 1500 } = options ?? {}
  let lastErr: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err

      // 429 限速 → 长退避，不再重试多次
      if (err?.status === 429 || err?.code === 429) {
        await new Promise((r) => setTimeout(r, 60_000))
        throw new Error('请求太频繁，请等待一分钟后再试')
      }

      // 最后一次尝试还失败 → 放弃重试
      if (attempt >= maxRetries - 1) break

      // 判断是否应该重试（网络错误才重试）
      const isNetworkError =
        err instanceof TypeError ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('Network request failed') ||
        err?.message?.includes('NetworkError')

      if (!isNetworkError) break

      // 指数退避：1.5s → 3s
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastErr
}
