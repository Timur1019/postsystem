import { Plus } from 'lucide-react';

export default function StockDocumentAddLineButton({ label, onClick, iconSize = 16 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm text-emerald-700"
    >
      <Plus size={iconSize} /> {label}
    </button>
  );
}
