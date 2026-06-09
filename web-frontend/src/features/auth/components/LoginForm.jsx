import { Eye, EyeOff, Loader } from 'lucide-react';

export default function LoginForm({
  t,
  form,
  showPass,
  onToggleShowPass,
  loading,
  onSubmit,
}) {
  const { register, formState: { errors } } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {t('login.username')}
        </label>
        <input
          {...register('username')}
          autoComplete="username"
          placeholder={t('login.usernamePh')}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {t('login.password')}
        </label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={onToggleShowPass}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader size={18} className="animate-spin" /> : null}
        {loading ? t('common.signingIn') : t('login.signIn')}
      </button>
    </form>
  );
}
