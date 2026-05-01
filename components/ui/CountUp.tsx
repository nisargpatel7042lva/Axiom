"use client";

import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

export interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  /** When set, use this many maximum fraction digits instead of inferring from from/to. */
  decimals?: number;
  /** When `decimals` is set, controls minimum fraction digits (default: same as `decimals`). Use `0` for compact numbers like share balances. */
  minDecimals?: number;
  prefix?: string;
  suffix?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  decimals: decimalsOverride,
  minDecimals: minDecimalsOverride,
  prefix = "",
  suffix = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useInView(ref, { once: true, margin: "0px" });

  const getDecimalPlaces = (num: number): number => {
    const str = num.toString();
    if (str.includes(".")) {
      const dec = str.split(".")[1];
      if (dec && parseInt(dec, 10) !== 0) {
        return dec.length;
      }
    }
    return 0;
  };

  const inferredMax = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));
  const maxDecimals = decimalsOverride !== undefined ? decimalsOverride : inferredMax;
  const minDecimals =
    decimalsOverride !== undefined
      ? (minDecimalsOverride !== undefined ? minDecimalsOverride : decimalsOverride)
      : inferredMax > 0
        ? inferredMax
        : 0;

  const formatValue = useCallback(
    (latest: number) => {
      const options: Intl.NumberFormatOptions = {
        useGrouping: Boolean(separator),
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
      };

      const formattedNumber = new Intl.NumberFormat("en-US", options).format(latest);

      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, minDecimals, separator],
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === "down" ? to : from);
    }
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      onStart?.();

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(() => {
        onEnd?.();
      }, delay * 1000 + duration * 1000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  const inner = <span ref={ref} className="tabular-nums" />;

  if (!prefix && !suffix) {
    return <span className={className}>{inner}</span>;
  }

  return (
    <span className={className}>
      {prefix ? <span className="select-none">{prefix}</span> : null}
      {inner}
      {suffix ? <span className="select-none">{suffix}</span> : null}
    </span>
  );
}
