interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export function Input({ label, type = 'text', placeholder, value, onChange, required }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[#e2e8f0]">
          {label} {required && <span className="text-[#3dd68c]">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="bg-[#2a2f38] border border-[#3a3f48] px-4 py-3 text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#3dd68c] transition-colors clip-corner-sm"
      />
    </div>
  );
}
