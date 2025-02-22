import React from "react";

interface RadioProps {
  label?: string;
  name: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const Radio: React.FC<RadioProps> = ({
  label,
  name,
  options,
  selectedValue,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && <p className="text-gray-700 font-medium">{label}</p>}
      <div className="flex flex-col space-y-2 mt-1">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className={`${disabled ? "text-gray-400" : "text-gray-900"}`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Radio;
