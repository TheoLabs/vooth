-- Role/Permission 시드 (idempotent)
-- core-api 의 Permission/Role/role_permissions 스키마 기준.
-- permission.code 는 PK 이므로 INSERT IGNORE 로 중복 무시.
-- role 은 type 당 1개만 존재하도록 NOT EXISTS 로 보호.
-- role_permissions 는 (roleId, codeId) 복합 PK 이므로 INSERT IGNORE.

-- =========================================================
-- 1) Permissions
--    code 컨벤션: "<category>:<action>"
-- =========================================================
INSERT IGNORE INTO permission (code, name, category, description) VALUES
  -- account
  ('account:read',         '계정 조회',       'account',      '계정 목록/상세를 조회한다'),
  ('account:create',       '계정 생성',       'account',      '계정을 생성한다'),
  ('account:update',       '계정 수정',       'account',      '계정 정보를 수정한다'),
  ('account:delete',       '계정 삭제',       'account',      '계정을 삭제(탈퇴 처리)한다'),
  ('account:approve',      '계정 승인',       'account',      '가입 신청 계정을 승인/반려한다'),
  -- role
  ('role:read',            '역할 조회',       'role',         '역할 목록/상세를 조회한다'),
  ('role:create',          '역할 생성',       'role',         '역할을 생성한다'),
  ('role:update',          '역할 수정',       'role',         '역할 및 권한 매핑을 수정한다'),
  ('role:delete',          '역할 삭제',       'role',         '역할을 삭제한다'),
  -- permission
  ('permission:read',      '권한 조회',       'permission',   '권한 목록을 조회한다'),
  -- content
  ('content:read',         '콘텐츠 조회',     'content',      '콘텐츠/에피소드/컷/대사를 조회한다'),
  ('content:create',       '콘텐츠 생성',     'content',      '콘텐츠/에피소드/컷/대사를 등록한다'),
  ('content:update',       '콘텐츠 수정',     'content',      '콘텐츠/에피소드/컷/대사를 수정한다'),
  ('content:delete',       '콘텐츠 삭제',     'content',      '콘텐츠/에피소드/컷/대사를 삭제한다'),
  ('content:review',       '콘텐츠 검수',     'content',      '녹음/연출 결과물을 검수(채택/반려)한다'),
  ('content:publish',      '콘텐츠 배포',     'content',      '콘텐츠를 배포/공개 상태로 전환한다'),
  -- settlement
  ('settlement:read',      '정산 조회',       'settlement',   '정산 내역을 조회한다'),
  ('settlement:create',    '정산 생성',       'settlement',   '정산 건을 생성한다'),
  ('settlement:update',    '정산 수정',       'settlement',   '정산 내역을 수정한다'),
  ('settlement:delete',    '정산 삭제',       'settlement',   '정산 건을 삭제한다'),
  -- stats
  ('stats:read',           '통계 조회',       'stats',        '통계/대시보드를 조회한다'),
  -- notification
  ('notification:read',    '알림 조회',       'notification', '알림 목록을 조회한다'),
  ('notification:create',  '알림 생성',       'notification', '알림 템플릿/캠페인을 생성한다'),
  ('notification:update',  '알림 수정',       'notification', '알림 템플릿/캠페인을 수정한다'),
  ('notification:delete',  '알림 삭제',       'notification', '알림 템플릿/캠페인을 삭제한다'),
  ('notification:send',    '알림 발송',       'notification', '알림을 발송한다'),
  -- system
  ('system:read',          '시스템 설정 조회', 'system',       '시스템 설정을 조회한다'),
  ('system:update',        '시스템 설정 수정', 'system',       '시스템 설정을 변경한다');

-- =========================================================
-- 2) Roles (type 당 1개, 멱등)
-- =========================================================
INSERT INTO role (type, name)
  SELECT 'SUPER', '슈퍼 관리자'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'SUPER');
INSERT INTO role (type, name)
  SELECT 'ACCOUNT_MANAGER', '계정 관리자'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'ACCOUNT_MANAGER');
INSERT INTO role (type, name)
  SELECT 'CONTENT_MANAGER', '콘텐츠 관리자'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'CONTENT_MANAGER');
INSERT INTO role (type, name)
  SELECT 'SETTLEMENT_MANAGER', '정산 관리자'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'SETTLEMENT_MANAGER');
INSERT INTO role (type, name)
  SELECT 'STATS_MANAGER', '통계 관리자'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'STATS_MANAGER');
INSERT INTO role (type, name)
  SELECT 'NOTIFICATION_MANAGER', '알림 관리자'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'NOTIFICATION_MANAGER');
INSERT INTO role (type, name)
  SELECT 'CREATOR', '크리에이터'
  WHERE NOT EXISTS (SELECT 1 FROM role WHERE type = 'CREATOR');

-- =========================================================
-- 3) Role ↔ Permission 매핑
-- =========================================================
-- SUPER: 전체 권한
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r CROSS JOIN permission p WHERE r.type = 'SUPER';

-- ACCOUNT_MANAGER: 계정 도메인 + 역할/권한 조회
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r JOIN permission p
    ON (p.category = 'account' OR p.code IN ('role:read', 'permission:read'))
  WHERE r.type = 'ACCOUNT_MANAGER';

-- CONTENT_MANAGER: 콘텐츠 도메인(검수 포함)
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r JOIN permission p ON p.category = 'content'
  WHERE r.type = 'CONTENT_MANAGER';

-- SETTLEMENT_MANAGER: 정산 도메인 + 통계 조회
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r JOIN permission p
    ON (p.category = 'settlement' OR p.code = 'stats:read')
  WHERE r.type = 'SETTLEMENT_MANAGER';

-- STATS_MANAGER: 통계 조회
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r JOIN permission p ON p.category = 'stats'
  WHERE r.type = 'STATS_MANAGER';

-- NOTIFICATION_MANAGER: 알림 도메인
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r JOIN permission p ON p.category = 'notification'
  WHERE r.type = 'NOTIFICATION_MANAGER';

-- CREATOR: 콘텐츠 조회(녹음 작업에 필요한 최소 권한)
INSERT IGNORE INTO role_permissions (roleId, codeId)
  SELECT r.id, p.code FROM role r JOIN permission p ON p.code = 'content:read'
  WHERE r.type = 'CREATOR';
