import React from "react";

type CTAButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const CTAButton: React.FC<CTAButtonProps> = ({
  label,
  onClick,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="py-4 px-14 text-xl text-white shadow-[0_4px_15px_rgba(217,26,91,0.3)] bg-he2b rounded-full font-bold border-0 cursor-pointer transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {label}
  </button>
);

export default CTAButton;
