import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  /** Roadmap step that will replace this placeholder. */
  step?: string;
  children?: ReactNode;
};

export function PageShell({
  title,
  description,
  step,
  children,
}: PageShellProps) {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      )}
      {step && (
        <p className="mt-6 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Placeholder · built in {step}
        </p>
      )}
      {children}
    </div>
  );
}
