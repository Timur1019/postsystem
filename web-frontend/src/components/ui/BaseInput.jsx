import { forwardRef } from 'react';
import clsx from 'clsx';
import { fieldErrorCls, inputCls, labelCls } from './uiClasses';

const BaseInput = forwardRef(function BaseInput(
  {
    label,
    error,
    required,
    as: Component = 'input',
    className,
    id,
    ...props
  },
  ref
) {
  const fieldId = id || props.name;

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className={labelCls}>
          {required && <span className="text-red-400">* </span>}
          {label}
        </label>
      )}
      <Component
        ref={ref}
        id={fieldId}
        className={clsx(inputCls, className)}
        {...props}
      />
      {error && <p className={fieldErrorCls}>{error}</p>}
    </div>
  );
});

export default BaseInput;
