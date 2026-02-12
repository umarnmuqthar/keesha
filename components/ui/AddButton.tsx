import type { ButtonHTMLAttributes } from "react";
import { Button } from "./Button";

export type AddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
};

export function AddButton({ size = "md", ...props }: AddButtonProps) {
  return <Button variant="primary" size={size} {...props} />;
}
