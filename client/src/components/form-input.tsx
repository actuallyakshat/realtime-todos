import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label
        className="block text-sm font-medium text-zinc-200"
        htmlFor={props.id}
      >
        {label}
      </label>
      <input
        className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-2 text-white placeholder-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary "
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
