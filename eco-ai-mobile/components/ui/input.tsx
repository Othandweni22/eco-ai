/**
 * Input primitive — equivalent of your shadcn <Input/>. Wraps RN's TextInput.
 * Use placeholderTextColor and keyboard props as you would in raw RN.
 */
import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor="#9ca3af"
        className={cn(
          "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
