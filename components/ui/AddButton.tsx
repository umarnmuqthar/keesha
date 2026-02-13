import type { ButtonHTMLAttributes } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";
import styles from "./addButton.module.css";

export type AddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
};

export function AddButton({
  size = "md",
  className,
  children,
  ...props
}: AddButtonProps) {
  const computedAriaLabel =
    props["aria-label"] || (typeof children === "string" ? children : "Add");

  return (
    <Button
      variant="primary"
      size={size}
      className={cn(styles.addButton, className)}
      aria-label={computedAriaLabel}
      {...props}
    >
      <span className={styles.label}>{children}</span>
      <Plus className={styles.icon} size={16} aria-hidden="true" />
    </Button>
  );
}
