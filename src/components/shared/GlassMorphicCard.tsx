
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassMorphicCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "purple" | "blue" | "pink" | "green";
}

export const GlassMorphicCard = ({ 
  children, 
  className, 
  variant = "default",
  ...props 
}: GlassMorphicCardProps) => {
  return (
    <div
      className={cn(
        "glass-effect rounded-xl p-6",
        variant === "purple" && "neon-glow-purple border-neon-purple/20",
        variant === "blue" && "neon-glow-blue border-neon-blue/20",
        variant === "pink" && "neon-glow-pink border-neon-pink/20",
        variant === "green" && "neon-glow-green border-green-400/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
