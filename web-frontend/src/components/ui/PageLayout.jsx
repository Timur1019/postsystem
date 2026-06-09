import clsx from 'clsx';
import PageHeader from './PageHeader';

export default function PageLayout({
  title,
  subtitle,
  actions,
  filters,
  children,
  className,
  spacing = 'space-y-6',
}) {
  return (
    <div className={clsx(spacing, className)}>
      {(title || subtitle || actions) && (
        <PageHeader title={title} subtitle={subtitle} actions={actions} />
      )}
      {filters}
      {children}
    </div>
  );
}
