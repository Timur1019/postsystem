import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

/** Подтянуть с сервера актуальные allowedModules и обновить JWT. */
export async function syncAuthSession() {
  const { token } = useAuthStore.getState();
  if (!token || token.split('.').length !== 3) return null;
  try {
    const res = await api.post('/auth/refresh');
    const { token: newToken, ...profile } = res.data;
    useAuthStore.getState().setAuth(newToken, profile);
    return profile;
  } catch {
    return null;
  }
}
