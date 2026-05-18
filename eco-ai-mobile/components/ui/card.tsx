/**
 * Card primitives — flat replacement for your shadcn card.tsx.
 * Same sub-component names so JSX from the web app translates by changing
 * tags only (e.g. <div> → <View>).
 */
import { View, Text, type ViewProps, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("mb-3 gap-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      className={cn("text-base font-semibold text-card-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("mt-3 flex-row items-center", className)}
      {...props}
    />
  );
}
