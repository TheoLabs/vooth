import { Breadcrumb } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_TREE } from './menu';
import { useContent } from '../features/contents/useContents';
import { useEpisode } from '../features/contents/useEpisodes';

interface Crumb {
  label: string;
  /** 있으면 클릭 가능(이동) */
  to?: string;
}

/** 정적 메뉴 경로 → (그룹, 리프) 라벨 매칭. */
function findMenuTrail(pathname: string): Crumb[] | null {
  for (const group of MENU_TREE) {
    if (group.path === pathname) return [{ label: group.label }];
    if (group.children) {
      const leaf = group.children.find((l) => l.path === pathname);
      if (leaf) return [{ label: group.label }, { label: leaf.label }];
    }
  }
  return null;
}

/** 모든 페이지 상단의 브레드크럼. 동적 라우트는 실제 제목을 표시. */
export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const segs = pathname.split('/').filter(Boolean);
  const isCuts =
    segs[0] === 'contents' && segs[2] === 'episodes' && segs[4] === 'cuts';
  const isContentDetail =
    segs[0] === 'contents' && segs.length === 2 && /^\d+$/.test(segs[1]);

  const cid = isCuts || isContentDetail ? Number(segs[1]) : NaN;
  const eid = isCuts ? Number(segs[3]) : null;

  const { data: content } = useContent(Number.isFinite(cid) ? cid : NaN);
  const { data: episode } = useEpisode(Number.isFinite(cid) ? cid : NaN, eid);

  let trail: Crumb[];
  if (isCuts) {
    trail = [
      { label: '컨텐츠' },
      { label: '작품 관리', to: '/contents' },
      { label: content?.title ?? '작품', to: `/contents/${cid}` },
      { label: episode ? `${episode.chapter}화 ${episode.title}` : '회차' },
      { label: '컷 관리' },
    ];
  } else if (isContentDetail) {
    trail = [
      { label: '컨텐츠' },
      { label: '작품 관리', to: '/contents' },
      { label: content?.title ?? '작품' },
    ];
  } else {
    trail = findMenuTrail(pathname) ?? [{ label: '홈', to: '/' }];
  }

  const items = trail.map((c) => ({
    title: c.to ? (
      <a
        onClick={(e) => {
          e.preventDefault();
          navigate(c.to!);
        }}
      >
        {c.label}
      </a>
    ) : (
      c.label
    ),
  }));

  return <Breadcrumb style={{ marginBottom: 12, flex: 'none' }} items={items} />;
}
