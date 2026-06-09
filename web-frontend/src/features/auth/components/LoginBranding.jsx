import BrandMark from '../../../components/shared/BrandMark';

export default function LoginBranding({ appName, subtitle }) {
  return (
    <div className="mb-7 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
        <BrandMark size={32} iconClassName="text-white" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{appName}</h1>
      <p className="mt-1.5 text-base text-slate-600">{subtitle}</p>
    </div>
  );
}
