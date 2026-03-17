"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";
import { cn, getThemeColor } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => {
  const theme = getThemeColor();

  // Mapeamento explícito para garantir que o Tailwind gere as classes do estado 'checked'
  const checkedColors: Record<string, string> = {
    blue: "data-[state=checked]:bg-blue-600",
    amber: "data-[state=checked]:bg-amber-500",
    teal: "data-[state=checked]:bg-teal-600",
    violet: "data-[state=checked]:bg-violet-600",
    green: "data-[state=checked]:bg-green-600",
    red: "data-[state=checked]:bg-red-600",
    orange: "data-[state=checked]:bg-orange-600",
    sky: "data-[state=checked]:bg-sky-600",
  };

  const ringColors: Record<string, string> = {
    blue: "focus-visible:ring-blue-500",
    amber: "focus-visible:ring-amber-500",
    teal: "focus-visible:ring-teal-500",
    violet: "focus-visible:ring-violet-500",
    green: "focus-visible:ring-green-500",
    red: "focus-visible:ring-red-500",
    orange: "focus-visible:ring-orange-500",
    sky: "focus-visible:ring-sky-500",
  };

  const checkedClass = checkedColors[theme.name] || checkedColors.blue;
  const ringClass = ringColors[theme.name] || ringColors.blue;

  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-neutral-700",
        checkedClass,
        ringClass,
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
