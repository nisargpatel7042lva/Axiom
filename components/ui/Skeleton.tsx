import { clsx } from "clsx";

export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-md bg-[#1a2332]/90",
        className,
      )}
      {...rest}
    />
  );
}
