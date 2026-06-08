import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../../api/auth.api';
import { useAuth } from '../../auth/AuthContext';

export function useGoogleLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (idToken: string) => googleLogin(idToken),
    onSuccess: ({ accessToken }) => {
      login(accessToken);
      navigate('/', { replace: true });
    },
  });
}
