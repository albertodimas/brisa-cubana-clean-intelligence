import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${crypto.randomUUID()}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-brisa-200 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 bg-brisa-800 border rounded-lg text-brisa-50 placeholder-brisa-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brisa-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-red-500 focus:ring-red-400"
              : "border-brisa-600 hover:border-brisa-500"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-brisa-400 text-sm mt-1">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
