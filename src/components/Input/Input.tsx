import type { ReactElement } from "react";

type InputStyle = "default" | "ghost" | "bordered";
type InputColor =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "error";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styleVariant?: InputStyle;
  color?: InputColor;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  label?: string;
  error?: string;
  helperText?: string;
  validator?: boolean;
  // Backward compatibility for existing usages before this refactor.
  variant?: "bordered" | "filled" | "faded";
}

/**
 * Componente de input com variantes e validação
 *
 * @param variant - Variante do input
 * @param size - Tamanho do input
 * @param label - Label do input
 * @param error - Mensagem de erro
 * @param helperText - Texto auxiliar
 */
export const Input = ({
  styleVariant = "default",
  color,
  size = "md",
  label,
  error,
  helperText,
  validator = false,
  variant,
  className = "",
  ...props
}: InputProps): ReactElement => {
  const inputStyle = props.style;
  const styleClasses: Record<InputStyle, string> = {
    default: "",
    ghost: "input-ghost",
    bordered: "input-bordered",
  };

  const colorClasses: Record<InputColor, string> = {
    neutral: "input-neutral",
    primary: "input-primary",
    secondary: "input-secondary",
    accent: "input-accent",
    info: "input-info",
    success: "input-success",
    warning: "input-warning",
    error: "input-error",
  };

  const sizeClasses: Record<NonNullable<InputProps["size"]>, string> = {
    xs: "input-xs",
    sm: "input-sm",
    md: "input-md",
    lg: "input-lg",
    xl: "input-xl",
  };

  const resolvedStyleVariant: InputStyle =
    variant === "faded" ? "ghost" : variant === "bordered" ? "bordered" : styleVariant;
  const styleClass = styleClasses[resolvedStyleVariant];
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const colorClass = color ? colorClasses[color] : "";
  const validatorClass = validator ? "validator" : "";
  const hasError = error ? "input-error" : "";

  return (
    <div className="w-full">
      {label && (
        <label className="label text-base-content">
          <span
            className="label-text text-base-content"
            style={{ WebkitTextFillColor: "currentColor" }}
          >
            {label}
          </span>
        </label>
      )}
      <input
        className={`input w-full text-base-content placeholder:text-base-content/60 ${styleClass} ${colorClass} ${sizeClass} ${validatorClass} ${hasError} ${className}`.trim()}
        {...props}
        style={{ WebkitTextFillColor: "currentColor", ...inputStyle }}
      />
      {error && (
        <label className="label text-error">
          <span
            className="label-text-alt text-error"
            style={{ WebkitTextFillColor: "currentColor" }}
          >
            {error}
          </span>
        </label>
      )}
      {helperText && !error && (
        <label className="label text-base-content">
          <span
            className="label-text-alt text-base-content/70"
            style={{ WebkitTextFillColor: "currentColor" }}
          >
            {helperText}
          </span>
        </label>
      )}
    </div>
  );
};
