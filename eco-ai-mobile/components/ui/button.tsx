/**
 * Minimal Button primitive — the rough equivalent of your shadcn `Button`.
 * Not a full port (no asChild, no Slot — those are Radix concepts), but
 * supports the same `variant` and `size` API so most className/variant
 * usage from the web app carries over.
 */
import { forwardRef } from "react";
import {
  Pressable,
  Text,
  type PressableProps,
  ActivityIndicator,
  View,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-md active:opacity-80",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const textVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface ButtonProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  loading?: boolean;
}

export const Button = forwardRef<View, ButtonProps>(
  (
    { variant, size, className, textClassName, children, loading, disabled, ...props },
    ref,
  ) => {
    return (
      <Pressable
        ref={ref as any}
        disabled={disabled || loading}
        className={cn(
          buttonVariants({ variant, size }),
          (disabled || loading) && "opacity-50",
          className,
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" />
        ) : typeof children === "string" ? (
          <Text className={cn(textVariants({ variant }), textClassName)}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Button.displayName = "Button";
