import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Focus tail (session 6, measured): the reference's old-shadcn base is
  // `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`
  // — a solid 1px near-black ring, NO border change. The new-gen tail
  // (3px ring-ring/50 + border-ring) was a visible keyboard-focus divergence.
  // transition-colors matches the reference generation (transition-all faded
  // every property; call-site customs like the CTA's transition-all win via tw-merge).
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          // Reference (re-measured session 5, computed): the reference's outline
          // `shadow-sm` is a Tailwind v3 class name — it COMPUTES to the light
          // 0 1px 2px/0.05 step, which is `shadow-xs` on the v4 scale. Parity
          // is the computed value, not the class name.
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Reference (measured session 5): the old-shadcn base has NO
        // :has(> svg) padding adaptation — its :has(> svg) specificity
        // (0,1,1) used to beat the plain px-4 (0,1,0), shrinking every
        // icon-bearing button to 12px while the reference renders 16px.
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
