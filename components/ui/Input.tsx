import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./input.module.css";

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export type InputProps = NativeInputProps & {
  uiSize?: "sm" | "md" | "lg";
};

export function Input({ className, uiSize = "md", ...props }: InputProps) {
  return (
    <input className={cn(styles.input, styles[uiSize], className)} {...props} />
  );
}
