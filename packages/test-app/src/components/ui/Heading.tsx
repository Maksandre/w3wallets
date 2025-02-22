import React from "react";

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const Heading: React.FC<HeadingProps> = ({ children, level = 1, className = "" }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const baseStyles = "font-bold text-gray-900";
  
  const sizeStyles = {
    1: "text-4xl leading-tight",
    2: "text-3xl leading-snug",
    3: "text-2xl leading-normal",
    4: "text-xl leading-relaxed",
    5: "text-lg leading-loose",
    6: "text-base leading-loose",
  };

  return <Tag className={`${baseStyles} ${sizeStyles[level]} ${className}`}>{children}</Tag>;
};

export default Heading;
