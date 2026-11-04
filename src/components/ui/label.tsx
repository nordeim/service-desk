"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      // The reference's shared Label class set (measured on its label chunk:
      // `text-sm font-medium leading-none peer-disabled:cursor-not-allowed
      // peer-disabled:opacity-70` — no display-changing class). The stock
      // shadcn form carried `flex items-center gap-2`, which renders the
      // label block-level and ignores the container's text-align — the
      // s103 login label-alignment parity fix: the label must inherit the
      // container's alignment (centered on the login card, left on the
      // submit form), byte-parity with the reference's rendering.
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
