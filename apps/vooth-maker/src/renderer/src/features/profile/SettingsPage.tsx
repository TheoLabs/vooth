import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMe, useUpdateMe } from '../me/useMe'
import { useAuth } from '../../auth/AuthContext'
import './SettingsPage.css'

// 서버 CreatorUpdateDto 는 bio/avatarFileId 만 수정 가능(nickname 수정 불가).
const profileSchema = z.object({
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

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    // me 로드 시점에 폼을 채운다(staleTime:Infinity 라 사용자 입력을 덮어쓰지 않음).
    values: { bio: me?.bio ?? '' },
  })

  const nickname = me?.nickname || '성우'
  const bio = watch('bio') ?? ''

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
    setAvatarUrl(URL.createObjectURL(file))
    setSaved(false)
  }

  const handleRemoveImage = (): void => {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    setAvatarUrl(null)
    setSaved(false)
  }

  const onSubmit = handleSubmit((values) => {
    setSaved(false)
    // avatarFileId 는 creators 파일 업로드 엔드포인트가 없어 아직 전송하지 않는다(bio 만 저장).
    update.mutate(
      { bio: values.bio },
      { onSuccess: () => setSaved(true) }
    )
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
            {avatarUrl ? (
              <img className="avatar avatar--img" src={avatarUrl} alt="프로필 미리보기" />
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
              {avatarUrl && (
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
              <p className="field-hint">미리보기만 가능합니다. 업로드 연동 예정. (mock)</p>
            </div>
          </div>
        </section>

        {/* 기본 정보 */}
        <section className="settings-section">
          <h3 className="settings-section__title">기본 정보</h3>

          <div className="field">
            <label className="field-label">활동명</label>
            <div className="field-readonly">{nickname}</div>
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
          {update.isError && (
            <span className="save-err">{update.error.message}</span>
          )}
          {saved && !update.isPending && <span className="save-ok">저장되었습니다.</span>}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!isDirty || update.isPending}
          >
            {update.isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
