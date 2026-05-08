"use client";

import * as React from "react";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-[#00e5c3]/20 text-[#00e5c3]",
  secondary: "border-transparent bg-[#8b5cf6]/20 text-[#a78bfa]",
  destructive: "border-transparent bg-[#f59e0b]/20 text-[#fbbf24]",
  outline: "text-[#8b9cb3] border-[#1f2e3d]",
};

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

export { Badge };
