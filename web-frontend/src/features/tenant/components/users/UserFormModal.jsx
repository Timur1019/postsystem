import { X } from 'lucide-react';
import { useUserFormModal } from '../../hooks/useUserFormModal';
import UserCredentialsCreatedModal from './UserCredentialsCreatedModal';
import UserFormModalFields from './UserFormModalFields';

export default function UserFormModal(props) {
  const p = useUserFormModal(props);

  if (!p.open && !p.createdCredentials) return null;

  if (p.open && p.isEdit && !p.user?.id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {p.t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <>
      <UserCredentialsCreatedModal
        credentials={p.createdCredentials}
        t={p.t}
        onClose={p.dismissCredentials}
      />
      {p.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b p-5 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {p.isEdit ? p.t('users.editUser') : p.t('users.newUser')}
              </h2>
              <button
                type="button"
                onClick={p.onClose}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <UserFormModalFields {...p} />
          </div>
        </div>
      ) : null}
    </>
  );
}
