export default function FinanceSelectHeader({ selectAllRef, checked, onChange, disabled }) {
  return (
    <th className="finance-table__check">
      <input
        ref={selectAllRef}
        type="checkbox"
        className="finance-table__checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label="Select all"
      />
    </th>
  );
}

export function FinanceSelectCell({ checked, onChange, disabled }) {
  return (
    <td className="finance-table__check" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        className="finance-table__checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </td>
  );
}
