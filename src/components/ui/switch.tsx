"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, checked, ...props }, ref) => {
  const { themeStyles } = useTheme();

  return (
    <SwitchPrimitive.Root
      checked={checked}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? themeStyles.solid : "bg-input",
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
