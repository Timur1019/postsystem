import { Search } from 'lucide-react';
import clsx from 'clsx';
import { inputCls } from './uiClasses';

export default function PageSearchField({
  value,
  onChange,
  placeholder,
  className,
}) {
  return (
    <div className={clsx('relative flex-1', className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(inputCls, 'py-2 pl-9 pr-4')}
      />
    </div>
  );
}
