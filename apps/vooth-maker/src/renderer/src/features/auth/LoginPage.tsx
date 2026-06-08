import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { loginSchema, type LoginInput } from './login.schema'
import { useLoginMutation } from './useLogin'
import './login.css'

export function LoginPage(): React.JSX.Element {
  const { user } = useAuth()
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const onSubmit = (values: LoginInput): void => {
    loginMutation.mutate(values)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-brand">Vooth Maker</h1>
          <p className="login-subtitle">보이스툰 제작 스튜디오</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="name@vooth.com"
              className={`login-input${errors.email ? ' has-error' : ''}`}
              {...register('email')}
            />
            {errors.email && <span className="login-error">{errors.email.message}</span>}
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              className={`login-input${errors.password ? ' has-error' : ''}`}
              {...register('password')}
            />
            {errors.password && <span className="login-error">{errors.password.message}</span>}
          </div>

          {loginMutation.isError && (
            <div className="login-form-error" role="alert">
              {loginMutation.error.message}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-hint">
          <strong>데모 계정</strong>
          <br />
          admin@vooth.com / password123
          <br />
          actor@vooth.com / password123
        </div>
      </div>
    </div>
  )
}
