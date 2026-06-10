import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import type {
  Character,
  Cut,
  Episode,
  Line,
  Tag,
  VoiceActor,
  Webtoon,
  WebtoonStatus,
} from './contentTypes';
import { TagColor } from '@vooth/shared';
import {
  EPISODES_MOCK,
  TAGS_MOCK,
  VOICE_ACTORS_MOCK,
  WEBTOONS_MOCK,
  cutPlaceholder,
} from '../../mocks/content.mock';

/**
 * 콘텐츠 관리 mock 스토어.
 * 백엔드 연동 전까지 작품/회차/컷/대사/캐스팅 CRUD 를 세션 로컬 상태로 유지한다.
 * (화면 이동 간 유지 — 추후 core-api + axios 로 대체)
 */
interface ContentStoreValue {
  webtoons: Webtoon[];
  episodes: Episode[];
  voiceActors: VoiceActor[];
  tags: Tag[];
  getWebtoon: (id: string) => Webtoon | undefined;
  getEpisode: (id: string) => Episode | undefined;
  episodesByWebtoon: (webtoonId: string) => Episode[];
  // 작품
  createWebtoon: (input: {
    title: string;
    description?: string;
    status: WebtoonStatus;
    tagIds?: string[];
  }) => void;
  updateWebtoon: (
    id: string,
    patch: Partial<Pick<Webtoon, 'title' | 'description' | 'status' | 'tagIds'>>,
  ) => void;
  // 태그 (작품과 N:M)
  createTag: (input: { name: string; color: TagColor }) => void;
  updateTag: (id: string, patch: Partial<Pick<Tag, 'name' | 'color'>>) => void;
  removeTag: (id: string) => void;
  // 등장인물 / 캐스팅
  addCharacter: (webtoonId: string, input: { name: string; color?: string }) => void;
  updateCharacter: (webtoonId: string, characterId: string, patch: Partial<Omit<Character, 'id'>>) => void;
  removeCharacter: (webtoonId: string, characterId: string) => void;
  // 회차
  createEpisode: (webtoonId: string, input: { episodeNo: number; title: string }) => void;
  updateEpisode: (id: string, patch: Partial<Pick<Episode, 'title' | 'status'>>) => void;
  /** 해당 작품에 회차가 하나도 없을 때만 factory 결과로 시드한다(상세 진입 시 mock 표시용). */
  ensureEpisodes: (webtoonId: string, factory: () => Episode[]) => void;
  // 컷
  addCut: (episodeId: string) => void;
  removeCut: (episodeId: string, cutId: string) => void;
  moveCut: (episodeId: string, cutId: string, dir: -1 | 1) => void;
  updateCut: (episodeId: string, cutId: string, patch: Partial<Pick<Cut, 'holdMs' | 'imageKey'>>) => void;
  // 대사
  addLine: (episodeId: string, cutId: string) => void;
  removeLine: (episodeId: string, cutId: string, lineId: string) => void;
  moveLine: (episodeId: string, cutId: string, lineId: string, dir: -1 | 1) => void;
  updateLine: (
    episodeId: string,
    cutId: string,
    lineId: string,
    patch: Partial<Pick<Line, 'text' | 'characterId' | 'gapBeforeMs'>>,
  ) => void;
}

const ContentContext = createContext<ContentStoreValue | null>(null);

const newId = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const now = (): string => new Date().toISOString();

/** 배열에서 id 항목을 dir(-1 위/+1 아래)로 이동하고 order 를 재부여. */
function moveBy<T extends { id: string; order: number }>(items: T[], id: string, dir: -1 | 1): T[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((it) => it.id === id);
  const next = idx + dir;
  if (idx < 0 || next < 0 || next >= sorted.length) return items;
  [sorted[idx], sorted[next]] = [sorted[next], sorted[idx]];
  return sorted.map((it, i) => ({ ...it, order: i + 1 }));
}

function ContentProvider({ children }: { children: ReactNode }) {
  const [webtoons, setWebtoons] = useState<Webtoon[]>(() => WEBTOONS_MOCK.map((w) => ({ ...w })));
  const [episodes, setEpisodes] = useState<Episode[]>(() => EPISODES_MOCK.map((e) => ({ ...e })));
  const [tags, setTags] = useState<Tag[]>(() => TAGS_MOCK.map((t) => ({ ...t })));

  const getWebtoon = useCallback((id: string) => webtoons.find((w) => w.id === id), [webtoons]);
  const getEpisode = useCallback((id: string) => episodes.find((e) => e.id === id), [episodes]);
  const episodesByWebtoon = useCallback(
    (webtoonId: string) => episodes.filter((e) => e.webtoonId === webtoonId).sort((a, b) => a.episodeNo - b.episodeNo),
    [episodes],
  );

  const mapWebtoon = (id: string, fn: (w: Webtoon) => Webtoon): void =>
    setWebtoons((prev) => prev.map((w) => (w.id === id ? { ...fn(w), updatedAt: now() } : w)));

  const mapEpisode = (id: string, fn: (e: Episode) => Episode): void =>
    setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...fn(e), updatedAt: now() } : e)));

  const mapCut = (episodeId: string, cutId: string, fn: (c: Cut) => Cut): void =>
    mapEpisode(episodeId, (e) => ({ ...e, cuts: e.cuts.map((c) => (c.id === cutId ? fn(c) : c)) }));

  const createWebtoon: ContentStoreValue['createWebtoon'] = useCallback((input) => {
    setWebtoons((prev) => [
      {
        id: newId('wt'),
        title: input.title,
        description: input.description,
        status: input.status,
        characters: [],
        tagIds: input.tagIds ?? [],
        updatedAt: now(),
      },
      ...prev,
    ]);
  }, []);

  const updateWebtoon: ContentStoreValue['updateWebtoon'] = useCallback((id, patch) => {
    mapWebtoon(id, (w) => ({ ...w, ...patch }));
  }, []);

  const createTag: ContentStoreValue['createTag'] = useCallback((input) => {
    setTags((prev) => [...prev, { id: newId('tag'), name: input.name, color: input.color }]);
  }, []);

  const updateTag: ContentStoreValue['updateTag'] = useCallback((id, patch) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const removeTag: ContentStoreValue['removeTag'] = useCallback((id) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    // N:M 정리: 모든 작품에서 해당 태그 참조 제거.
    setWebtoons((prev) =>
      prev.map((w) => (w.tagIds.includes(id) ? { ...w, tagIds: w.tagIds.filter((t) => t !== id) } : w)),
    );
  }, []);

  const addCharacter: ContentStoreValue['addCharacter'] = useCallback((webtoonId, input) => {
    mapWebtoon(webtoonId, (w) => ({
      ...w,
      characters: [...w.characters, { id: newId('ch'), name: input.name, color: input.color, castVoiceActorIds: [] }],
    }));
  }, []);

  const updateCharacter: ContentStoreValue['updateCharacter'] = useCallback((webtoonId, characterId, patch) => {
    mapWebtoon(webtoonId, (w) => ({
      ...w,
      characters: w.characters.map((c) => (c.id === characterId ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCharacter: ContentStoreValue['removeCharacter'] = useCallback((webtoonId, characterId) => {
    mapWebtoon(webtoonId, (w) => ({ ...w, characters: w.characters.filter((c) => c.id !== characterId) }));
  }, []);

  const createEpisode: ContentStoreValue['createEpisode'] = useCallback((webtoonId, input) => {
    setEpisodes((prev) => [
      ...prev,
      {
        id: newId('ep'),
        webtoonId,
        episodeNo: input.episodeNo,
        title: input.title,
        status: 'DRAFT',
        cuts: [],
        updatedAt: now(),
      },
    ]);
  }, []);

  const updateEpisode: ContentStoreValue['updateEpisode'] = useCallback((id, patch) => {
    mapEpisode(id, (e) => ({ ...e, ...patch }));
  }, []);

  const ensureEpisodes: ContentStoreValue['ensureEpisodes'] = useCallback((webtoonId, factory) => {
    // 이미 회차가 있으면 시드하지 않는다(StrictMode 중복 호출에도 안전).
    setEpisodes((prev) => (prev.some((e) => e.webtoonId === webtoonId) ? prev : [...prev, ...factory()]));
  }, []);

  const addCut: ContentStoreValue['addCut'] = useCallback((episodeId) => {
    mapEpisode(episodeId, (e) => {
      const order = e.cuts.length + 1;
      return { ...e, cuts: [...e.cuts, { id: newId('cut'), order, imageKey: cutPlaceholder(order), holdMs: 0, lines: [] }] };
    });
  }, []);

  const removeCut: ContentStoreValue['removeCut'] = useCallback((episodeId, cutId) => {
    mapEpisode(episodeId, (e) => ({
      ...e,
      cuts: e.cuts.filter((c) => c.id !== cutId).map((c, i) => ({ ...c, order: i + 1 })),
    }));
  }, []);

  const moveCut: ContentStoreValue['moveCut'] = useCallback((episodeId, cutId, dir) => {
    mapEpisode(episodeId, (e) => ({ ...e, cuts: moveBy(e.cuts, cutId, dir) }));
  }, []);

  const updateCut: ContentStoreValue['updateCut'] = useCallback((episodeId, cutId, patch) => {
    mapCut(episodeId, cutId, (c) => ({ ...c, ...patch }));
  }, []);

  const addLine: ContentStoreValue['addLine'] = useCallback((episodeId, cutId) => {
    mapCut(episodeId, cutId, (c) => ({
      ...c,
      lines: [...c.lines, { id: newId('l'), order: c.lines.length + 1, text: '', gapBeforeMs: 0 }],
    }));
  }, []);

  const removeLine: ContentStoreValue['removeLine'] = useCallback((episodeId, cutId, lineId) => {
    mapCut(episodeId, cutId, (c) => ({
      ...c,
      lines: c.lines.filter((l) => l.id !== lineId).map((l, i) => ({ ...l, order: i + 1 })),
    }));
  }, []);

  const moveLine: ContentStoreValue['moveLine'] = useCallback((episodeId, cutId, lineId, dir) => {
    mapCut(episodeId, cutId, (c) => ({ ...c, lines: moveBy(c.lines, lineId, dir) }));
  }, []);

  const updateLine: ContentStoreValue['updateLine'] = useCallback((episodeId, cutId, lineId, patch) => {
    mapCut(episodeId, cutId, (c) => ({
      ...c,
      lines: c.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    }));
  }, []);

  const value = useMemo<ContentStoreValue>(
    () => ({
      webtoons,
      episodes,
      voiceActors: VOICE_ACTORS_MOCK,
      tags,
      getWebtoon,
      getEpisode,
      episodesByWebtoon,
      createWebtoon,
      updateWebtoon,
      createTag,
      updateTag,
      removeTag,
      addCharacter,
      updateCharacter,
      removeCharacter,
      createEpisode,
      updateEpisode,
      ensureEpisodes,
      addCut,
      removeCut,
      moveCut,
      updateCut,
      addLine,
      removeLine,
      moveLine,
      updateLine,
    }),
    [
      webtoons,
      episodes,
      tags,
      getWebtoon,
      getEpisode,
      episodesByWebtoon,
      createWebtoon,
      updateWebtoon,
      createTag,
      updateTag,
      removeTag,
      addCharacter,
      updateCharacter,
      removeCharacter,
      createEpisode,
      updateEpisode,
      ensureEpisodes,
      addCut,
      removeCut,
      moveCut,
      updateCut,
      addLine,
      removeLine,
      moveLine,
      updateLine,
    ],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

/** /content 라우트 그룹 레이아웃: 콘텐츠 스토어를 하위 화면에 공유. */
export function ContentLayout() {
  return (
    <ContentProvider>
      <Outlet />
    </ContentProvider>
  );
}

export function useContentStore(): ContentStoreValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContentStore must be used within ContentLayout');
  return ctx;
}
