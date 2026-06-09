import clsx from 'clsx';

export default function BaseTable({
  children,
  footer,
  isLoading = false,
  isEmpty = false,
  loadingMessage,
  emptyMessage,
  colSpan = 1,
  minWidth,
  className,
  tableClassName,
}) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table
          className={clsx('w-full text-sm', tableClassName)}
          style={minWidth ? { minWidth } : undefined}
        >
          {isLoading || isEmpty ? (
            <tbody>
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  {isLoading ? loadingMessage : emptyMessage}
                </td>
              </tr>
            </tbody>
          ) : (
            children
          )}
        </table>
      </div>
      {footer}
    </div>
  );
}
