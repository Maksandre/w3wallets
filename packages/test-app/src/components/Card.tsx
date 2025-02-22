import React from "react";
import Container from "./ui/Container";

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardContainerProps> = ({ children, className = "" }) => {
  return (
    <div className="p-2">
      <Container
        className={`p-6 bg-white rounded-lg shadow-md space-y-6 ${className}`}
      >
        {children}
      </Container>
    </div>
  );
};

export default Card;
