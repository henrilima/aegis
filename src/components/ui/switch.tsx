"use client";

import { motion } from "framer-motion";
import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn, HEX_COLORS } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, checked, style, ...props }, ref) => {
  const { themeStyles } = useTheme();
  const themeColorName = themeStyles.name;
  // Usa cor hex diretamente via inline style para evitar problemas de purge do Tailwind
  // com classes dinâmicas geradas em runtime (ex: bg-pink-600)
  const accentHex =
    HEX_COLORS[themeColorName as keyof typeof HEX_COLORS] || HEX_COLORS.blue;

  const [isChecked, setIsChecked] = React.useState(
    checked ?? props.defaultChecked ?? false,
  );
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={(val) => {
        setIsChecked(val);
        props.onCheckedChange?.(val);
      }}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "bg-input data-[state=checked]:bg-[var(--switch-checked-bg)]",
        className,
      )}
      style={
        {
          "--switch-checked-bg": accentHex,
          ...style,
        } as React.CSSProperties
      }
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          animate={{ x: isChecked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="pointer-events-none block h-5 w-5 rounded-full bg-background ring-0"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
