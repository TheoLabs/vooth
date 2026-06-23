import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../auth/AuthContext';
import { useGoogleLogin } from './useLogin';
import './login.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mutate, isPending, isError } = useGoogleLogin();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <span className="login__logo">V</span>
          <h1 className="login__title">Vooth Back Office</h1>
          <p className="login__subtitle">사내 관리자 콘솔에 로그인하세요</p>
        </div>

        {GOOGLE_CLIENT_ID ? (
          <div className="login__google">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                const credential = credentialResponse.credential;
                if (credential) mutate(credential);
              }}
              onError={() => {
                /* GoogleLogin 자체 오류 — 아래 안내 문구로 처리 */
              }}
            />
          </div>
        ) : (
          <p className="login__error">
            VITE_GOOGLE_CLIENT_ID 가 설정되지 않았습니다. .env 를 확인해주세요.
          </p>
        )}

        {isPending && <p className="login__hint">로그인 중…</p>}

        {isError && (
          <p className="login__error">로그인에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
        )}

        <p className="login__hint">사내 Google 계정만 접근할 수 있습니다.</p>
      </div>
    </div>
  );
}
