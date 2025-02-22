import React from "react";
import NextLink from "next/link";

interface LinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

const Link: React.FC<LinkProps> = ({ href, children, external = false, className = "" }) => {
  const baseStyles = "text-blue-600 hover:underline";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${baseStyles} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} className={`${baseStyles} ${className}`}>
      {children}
    </NextLink>
  );
};

export default Link;
