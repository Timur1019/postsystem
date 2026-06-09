import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useTenantDisplayStore } from '../store/tenantDisplayStore';
import { resetConnectivityStabilizer } from '../store/connectivityStore';
/** Сброс клиентского состояния при смене пользователя / компании. */
export function resetClientSessionState() {
  queryClient.clear();
  useCartStore.getState().clearCart();
  const display = useTenantDisplayStore.getState();
  if (typeof display.resetSession === 'function') {
    display.resetSession();
  }
}

export function logoutAndResetSession() {
  resetConnectivityStabilizer();
  resetClientSessionState();
  useAuthStore.getState().logout();
}
