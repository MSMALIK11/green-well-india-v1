"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Root is a full-screen flex center so the panel stays visually centered.
 * Animations run on an inner wrapper so `zoom-in` / `fade-in` keyframes do not
 * override `translate(-50%,-50%)` (which made tall modals feel like they opened from the bottom).
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "group pointer-events-none fixed inset-0 z-[101] flex items-center justify-center border-0 bg-transparent p-4 shadow-none outline-none duration-200",
      )}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-auto relative grid w-full max-w-lg gap-0 duration-200",
          "group-data-[state=open]:animate-in group-data-[state=open]:fade-in-0 group-data-[state=open]:zoom-in-95",
          "group-data-[state=closed]:animate-out group-data-[state=closed]:fade-out-0 group-data-[state=closed]:zoom-out-95",
          className,
        )}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-gray-600 opacity-80 ring-offset-background transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export { Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent };
