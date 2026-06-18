/**
 * 캐릭터 역할군. 값은 문자열 enum.
 * 역할군 추가는 dev 수준(가끔)으로 가정 → ENUM 끝에 append(중간 삽입·재배열 금지).
 * 정렬은 ENUM 선언 순서가 아니라 CHARACTER_TYPE_ORDER 우선순위 맵으로 한다(선언순에 묶으면 추가 시 깨짐).
 */
export enum CharacterType {
  MAIN = 'main', // 주연
  SUPPORTING = 'supporting', // 조연
  EXTRA = 'extra', // 엑스트라
  NARRATOR = 'narrator', // 내레이터(해설)
}

/** 캐릭터 역할군 한글 라벨(표시/에러용). */
export const CHARACTER_TYPE_LABEL: Record<CharacterType, string> = {
  [CharacterType.MAIN]: '주연',
  [CharacterType.SUPPORTING]: '조연',
  [CharacterType.EXTRA]: '엑스트라',
  [CharacterType.NARRATOR]: '내레이터',
};

/**
 * 역할군 정렬 우선순위(낮을수록 앞). 10 단위로 띄워 사이 끼움 여지 확보.
 * 목록 정렬: 우선순위(type) → order → name.
 */
export const CHARACTER_TYPE_ORDER: Record<CharacterType, number> = {
  [CharacterType.MAIN]: 10,
  [CharacterType.SUPPORTING]: 20,
  [CharacterType.EXTRA]: 90,
  [CharacterType.NARRATOR]: 95,
};

/**
 * 우선순위 오름차순으로 정렬된 역할군 목록.
 * DB 정렬용 `FIELD(type, …)` 인자나 메모리 정렬 기준 생성에 사용.
 */
export const CHARACTER_TYPES_BY_PRIORITY: CharacterType[] = (
  Object.keys(CHARACTER_TYPE_ORDER) as CharacterType[]
).sort((a, b) => CHARACTER_TYPE_ORDER[a] - CHARACTER_TYPE_ORDER[b]);
