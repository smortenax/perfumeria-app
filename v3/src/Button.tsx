import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * The app's three buttons (audit 2026-10-24, F-11 L2), so that a colour means one thing everywhere:
 * «primary», the main action of a view, in the accent (the ink, V3-75); «secondary», on paper with a
 * field's edge; «danger», what deletes, outlined in red. Their look is in theme/buttons.css. Links,
 * menu items, pills and the bench's tools keep their own look: they are not these.
 */
export type ButtonVariant = "primary" | "secondary" | "danger";

export const buttonClass = (variant: ButtonVariant, className?: string): string =>
  ["btn", `btn-${variant}`, className].filter((c) => c).join(" ");

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(function Button(
  { variant = "secondary", className, type = "button", ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, className)} {...rest} />;
});
