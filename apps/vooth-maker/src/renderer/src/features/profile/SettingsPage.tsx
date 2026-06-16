import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMe, useUpdateMe } from '../me/useMe'
import { useAuth } from '../../auth/AuthContext'
import { uploadAvatar } from '../../api/file.api'
import './SettingsPage.css'

// 서버 CreatorUpdateDto 와 동일하게 nickname/bio 수정 가능(avatar 는 별도 업로드 흐름).
const profileSchema = z.object({
  nickname: z.string().trim().min(1, '활동명을 입력해주세요.').max(20, '20자 이내로 입력해주세요.'),
  bio: z.string().trim().max(200, '자기소개는 200자 이내로 입력해주세요.'),
})

type ProfileForm = z.infer<typeof profileSchema>

/** 활동명 첫 글자 아바타 배경색(결정적) */
const AVATAR_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
function avatarColor(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function SettingsPage(): React.JSX.Element {
  // 자기소개는 GET /creators/me 실데이터, 이메일은 토큰(useAuth)에서 사용.
  const { data: me } = useMe()
  const { user } = useAuth()
  const update = useUpdateMe()

  // 아바타: 선택한 파일(업로드 대상) + 미리보기 URL + 기존 아바타 삭제 의도
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarCleared, setAvatarCleared] = useState(false)

  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    // me 로드 시점에 폼을 채운다(staleTime:Infinity 라 사용자 입력을 덮어쓰지 않음).
    values: { nickname: me?.nickname ?? '', bio: me?.bio ?? '' },
  })

  // 아바타 이니셜은 입력 중인 활동명을 반영
  const nickname = watch('nickname') || me?.nickname || '성우'
  const bio = watch('bio') ?? ''

  // 표시 아바타: 로컬 미리보기 > (삭제 안 했으면) 서버 저장 이미지 > 이니셜
  const displayAvatarUrl = avatarUrl ?? (avatarCleared ? null : me?.avatarUrl ?? null)

  // 아바타 미리보기 objectURL 정리
  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    }
  }, [avatarUrl])

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    setAvatarFile(file)
    setAvatarUrl(URL.createObjectURL(file))
    setAvatarCleared(false)
    setSaved(false)
  }

  const handleRemoveImage = (): void => {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    setAvatarFile(null)
    setAvatarUrl(null)
    setAvatarCleared(true)
    setSaved(false)
  }

  const avatarChanged = avatarFile !== null || avatarCleared
  const canSave = (isDirty || avatarChanged) && !submitting

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false)
    setErrorMsg(null)
    setSubmitting(true)
    try {
      // 아바타: 새 파일이면 업로드 후 fileId, 삭제면 null, 변경 없으면 미전송(undefined).
      let avatarFileId: number | null | undefined
      if (avatarFile) avatarFileId = await uploadAvatar(avatarFile)
      else if (avatarCleared) avatarFileId = null

      await update.mutateAsync({
        nickname: values.nickname,
        bio: values.bio,
        ...(avatarFileId !== undefined ? { avatarFileId } : {}),
      })

      // 업로드한 파일은 채택됨 → 재업로드 방지. 미리보기는 세션 동안 유지.
      setAvatarFile(null)
      setAvatarCleared(false)
      setSaved(true)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <div className="settings">
      <div className="settings__greeting">
        <h2 className="settings__title">설정 · 내 정보</h2>
      </div>

      <form className="settings-card" onSubmit={onSubmit}>
        {/* 아바타 */}
        <section className="settings-section">
          <h3 className="settings-section__title">프로필 이미지</h3>
          <div className="avatar-row">
            {displayAvatarUrl ? (
              <img className="avatar avatar--img" src={displayAvatarUrl} alt="프로필 이미지" />
            ) : (
              <span className="avatar" style={{ backgroundColor: avatarColor(nickname) }}>
                {nickname.slice(0, 1)}
              </span>
            )}
            <div className="avatar-actions">
              <button
                type="button"
                className="btn"
                onClick={() => fileInputRef.current?.click()}
              >
                이미지 변경
              </button>
              {displayAvatarUrl && (
                <button type="button" className="btn btn--ghost" onClick={handleRemoveImage}>
                  기본 이미지로
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePickImage}
              />
              <p className="field-hint">JPG/PNG, 정사각형 이미지를 권장합니다.</p>
            </div>
          </div>
        </section>

        {/* 기본 정보 */}
        <section className="settings-section">
          <h3 className="settings-section__title">기본 정보</h3>

          <div className="field">
            <label className="field-label" htmlFor="nickname">
              활동명
            </label>
            <input id="nickname" className="field-input" type="text" {...register('nickname')} />
            {errors.nickname && <span className="field-error">{errors.nickname.message}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="bio">
              자기소개
            </label>
            <textarea id="bio" className="field-input field-textarea" rows={4} {...register('bio')} />
            <div className="field-foot">
              {errors.bio ? (
                <span className="field-error">{errors.bio.message}</span>
              ) : (
                <span className="field-hint">강점·경력 등을 자유롭게 작성하세요.</span>
              )}
              <span className="field-count">{bio.length}/200</span>
            </div>
          </div>

          <div className="field">
            <label className="field-label">이메일</label>
            <div className="field-readonly">{user?.email ?? '-'}</div>
          </div>
        </section>

        <div className="settings-foot">
          {errorMsg && <span className="save-err">{errorMsg}</span>}
          {saved && !submitting && <span className="save-ok">저장되었습니다.</span>}
          <button type="submit" className="btn btn--primary" disabled={!canSave}>
            {submitting ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
