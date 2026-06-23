import { useEffect, useState } from 'react'

/**
 * value 가 delay(ms) 동안 더 바뀌지 않으면 그때 갱신되는 디바운스 값.
 * 검색어처럼 입력마다 요청이 나가는 걸 막을 때 사용.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
