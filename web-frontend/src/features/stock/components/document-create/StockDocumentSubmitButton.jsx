const VARIANT_CLS = {
  full: 'w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8',
  compact: 'rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50',
};

export default function StockDocumentSubmitButton({ label, onClick, disabled, variant = 'compact' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={VARIANT_CLS[variant]}
    >
      {label}
    </button>
  );
}
