import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { mockGoogleLogin } from '../../api/auth.api';
import { useAuth } from '../../auth/AuthContext';

export function useGoogleLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: mockGoogleLogin,
    onSuccess: ({ user }) => {
      login(user);
      navigate('/', { replace: true });
    },
  });
}
