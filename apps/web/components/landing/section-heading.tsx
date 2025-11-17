import { cn } from "@/lib/cn";
import { ScrollReveal } from "@/components/ui";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "right";
  className?: string;
  animated?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  animated = true,
}: SectionHeadingProps) {
  const alignment =
    align === "center"
      ? "text-center items-center"
      : align === "right"
        ? "text-right items-end"
        : "text-left items-start";

  const Content = (
    <>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-brisa-600 dark:text-brisa-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl sm:text-4xl font-semibold text-[#0d1e2b] dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-200 max-w-3xl">
          {description}
        </p>
      ) : null}
    </>
  );

  if (!animated) {
    return (
      <div className={cn("flex flex-col gap-3", alignment, className)}>
        {Content}
      </div>
    );
  }

  return (
    <ScrollReveal
      variant="fadeUp"
      className={cn("flex flex-col gap-3", alignment, className)}
    >
      {Content}
    </ScrollReveal>
  );
}
