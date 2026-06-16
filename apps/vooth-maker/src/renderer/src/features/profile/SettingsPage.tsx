import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMe } from '../me/useMe'
import './SettingsPage.css'

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

// 현재 프로필 mock (Creator.nickname/bio/avatar — /creators/me 에 아직 없어 목 값으로 시작)
const MOCK_PROFILE: ProfileForm = {
  nickname: '레이첼',
  bio: '청량한 음색을 강점으로 로맨스·판타지 장르를 주로 녹음합니다.',
}

export function SettingsPage(): React.JSX.Element {
  const { data: account } = useMe()

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
    defaultValues: MOCK_PROFILE,
  })

  const nickname = watch('nickname') || MOCK_PROFILE.nickname
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

  const onSubmit = handleSubmit(() => {
    // TODO: creators/* 프로필 수정 API 연동 (nickname/bio/avatar). 현재는 mock 저장.
    setSaved(true)
  })

  return (
    <div className="settings">
      <div className="settings__greeting">
        <h2 className="settings__title">설정 · 내 정보</h2>
        <span className="settings__mock-tag">MOCK</span>
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
            <div className="field-readonly">{account?.email ?? '-'}</div>
          </div>
        </section>

        <div className="settings-foot">
          {saved && <span className="save-ok">저장되었습니다. (mock)</span>}
          <button type="submit" className="btn btn--primary" disabled={!isDirty && !avatarUrl}>
            저장
          </button>
        </div>
      </form>
    </div>
  )
}
