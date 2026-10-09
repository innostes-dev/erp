import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, buttonVariants, type ButtonProps } from "../button/button.js";
import { ButtonGroup } from "../button-group/button-group.js";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../dropdown-menu/dropdown-menu.js";

export type SplitButtonOption = {
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  leftIcon?: React.ReactNode;
};

export type SplitButtonProps = Omit<ButtonProps, "rightIcon" | "className"> & {
  options: SplitButtonOption[];
  dropdownAriaLabel?: string;
  className?: string;
};

export const SplitButton = React.forwardRef<HTMLButtonElement, SplitButtonProps>(
  (
    {
      children,
      onClick,
      variant = "primary",
      size = "default",
      disabled,
      isLoading,
      options,
      dropdownAriaLabel = "More options",
      className,
      ...props
    },
    ref
  ) => {
    return (
      <ButtonGroup className={className}>
        <Button
          ref={ref}
          variant={variant}
          size={size}
          disabled={disabled}
          isLoading={isLoading}
          onClick={onClick}
          {...props}
        >
          {children}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant, size, className: "px-2 rounded-l-none" })}
            disabled={disabled || isLoading}
            aria-label={dropdownAriaLabel}
          >
            <ChevronDown className="w-4 h-4 opacity-80" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {options.map((opt, index) => (
              <div
                key={index}
                onClick={() => {
                  if (!opt.disabled) opt.onClick();
                }}
                className={`px-2.5 py-1.5 text-sm font-medium rounded-sm cursor-pointer hover:bg-background flex items-center gap-2 ${
                  opt.destructive ? "text-danger hover:bg-danger/10" : "text-navy"
                } ${opt.disabled ? "opacity-40 pointer-events-none" : ""}`}
              >
                {opt.leftIcon ? (
                  <span className="[&_svg]:size-4 text-slate">{opt.leftIcon}</span>
                ) : null}
                {opt.label}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    );
  }
);

SplitButton.displayName = "SplitButton";
