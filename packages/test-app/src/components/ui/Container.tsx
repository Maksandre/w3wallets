import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
}

const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  maxWidth = "4xl",
}) => {
  return (
    <div className={`px-6 py-4 max-w-${maxWidth} ${className}`}>
      {children}
    </div>
  );
};

export default Container;
