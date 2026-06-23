import { useSearchParams } from 'react-router-dom';

/**
 * 목록 화면의 검색/필터/페이지 상태를 URL 쿼리스트링에 동기화하기 위한 코덱.
 * parse: URL → 값, write: 값 → URL(기본값이면 파라미터 제거로 URL을 깔끔하게 유지).
 */
export interface ParamCodec<T> {
  parse: (params: URLSearchParams, key: string) => T;
  write: (params: URLSearchParams, key: string, value: T) => void;
}

type Decoded<C> = C extends ParamCodec<infer T> ? T : never;

export const stringParam = (def = ''): ParamCodec<string> => ({
  parse: (p, k) => p.get(k) ?? def,
  write: (p, k, v) => {
    if (!v || v === def) p.delete(k);
    else p.set(k, v);
  },
});

export const numberParam = (def: number): ParamCodec<number> => ({
  parse: (p, k) => {
    const raw = p.get(k);
    if (raw == null) return def;
    const n = Number(raw);
    return Number.isFinite(n) ? n : def;
  },
  write: (p, k, v) => {
    if (v === def) p.delete(k);
    else p.set(k, String(v));
  },
});

/** 문자열(enum 포함) 배열 파라미터. `?k=a&k=b` 반복 형태로 직렬화. */
export function stringArrayParam<T extends string = string>(): ParamCodec<T[]> {
  return {
    parse: (p, k) => p.getAll(k) as T[],
    write: (p, k, v) => {
      p.delete(k);
      v.forEach((x) => p.append(k, x));
    },
  };
}

/** 숫자 배열 파라미터(예: tagIds). 반복 형태로 직렬화. */
export function numberArrayParam(): ParamCodec<number[]> {
  return {
    parse: (p, k) => p.getAll(k).map(Number).filter((n) => Number.isFinite(n)),
    write: (p, k, v) => {
      p.delete(k);
      v.forEach((x) => p.append(k, String(x)));
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema = Record<string, ParamCodec<any>>;
type StateOf<S extends Schema> = { [K in keyof S]: Decoded<S[K]> };

/**
 * 목록 상태를 URL 과 동기화하는 훅.
 * - 새로고침/뒤로가기에도 검색·필터·페이지가 유지된다.
 * - `patch` 는 여러 키를 한 번의 갱신으로 적용한다(필터 변경 + 페이지 1 리셋 동시 처리 시 유실 방지).
 *
 * @param prefix 한 화면(라우트) 안에서 여러 목록(탭 등)을 구분할 때 키 접두사.
 */
export function useUrlQuery<S extends Schema>(
  schema: S,
  prefix = '',
): [StateOf<S>, (patch: Partial<StateOf<S>>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = {} as StateOf<S>;
  for (const key in schema) {
    state[key] = schema[key].parse(searchParams, prefix + key) as Decoded<S[typeof key]>;
  }

  const patch = (changes: Partial<StateOf<S>>) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        for (const key in changes) {
          schema[key].write(params, prefix + key, changes[key] as Decoded<S[typeof key]>);
        }
        return params;
      },
      { replace: true },
    );
  };

  return [state, patch];
}
