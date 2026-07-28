import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink/90 disabled:bg-ink/40 shadow-soft",
  secondary:
    "bg-accent text-white hover:bg-accent-deep disabled:opacity-50 shadow-sm",
  ghost:
    "bg-transparent text-ink border border-line hover:border-ink disabled:opacity-50",
  danger:
    "bg-transparent text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm
        font-medium transition active:scale-[0.99] disabled:cursor-not-allowed
        ${styles[variant]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
