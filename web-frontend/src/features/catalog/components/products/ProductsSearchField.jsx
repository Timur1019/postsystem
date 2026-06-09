import { Search } from 'lucide-react';
import { inputCls } from '../../../../components/ui';

export default function ProductsSearchField({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 max-w-xl">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + ' py-2 pl-9 pr-4'}
      />
    </div>
  );
}
