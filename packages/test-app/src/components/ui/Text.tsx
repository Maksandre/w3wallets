import React from "react";

interface TextProps {
  children: React.ReactNode;
  as?: "p" | "span" | "strong";
  size?: "sm" | "base" | "lg" | "xl";
  color?: "primary" | "secondary" | "gray" | "danger" | "success";
  weight?: "light" | "normal" | "medium" | "bold";
  align?: "left" | "center" | "right" | "justify";
  className?: string;
  testId?: string
}

const Text: React.FC<TextProps> = ({
  children,
  as = "p",
  size = "base",
  color = "gray",
  weight = "normal",
  align = "left",
  className = "",
  testId
}) => {
  const Tag = as;

  const sizeStyles = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const colorStyles = {
    primary: "text-blue-600",
    secondary: "text-gray-700",
    gray: "text-gray-900",
    danger: "text-red-600",
    success: "text-green-600",
  };

  const weightStyles = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    bold: "font-bold",
  };

  return (
    <Tag
      className={`${sizeStyles[size]} ${colorStyles[color]} ${weightStyles[weight]} text-${align} ${className}`}
      data-testid={testId}
    >
      {children}
    </Tag>
  );
};

export default Text;
