import { useEffect, useState } from 'react';
import { queryCreators, type Creator, type CreatorListQuery } from './creator.types';

interface CreatorListResult {
  items: Creator[];
  total: number;
}

/**
 * 성우 목록 목(mock) 훅.
 * - 실제 API 대신 로컬 목 데이터를 필터/페이지네이션한다.
 * - 네트워크 느낌을 위해 짧은 로딩 지연을 두고, 갱신 중에는 이전 데이터를 유지한다.
 * - core-api 연동 시 이 훅을 react-query 기반으로 교체한다.
 */
export function useCreators(query: CreatorListQuery) {
  const [data, setData] = useState<CreatorListResult>();
  const [isLoading, setIsLoading] = useState(true);
  const key = JSON.stringify(query);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setData(queryCreators(query));
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading };
}
