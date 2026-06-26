import * as React from "react"

export interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  thumbColor?: "primary" | "destructive" | "blue";
}

export const RangeSlider = React.forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ className, thumbColor = "primary", ...props }, ref) => {
    const colorClass = 
      thumbColor === "primary" ? "accent-primary" : 
      thumbColor === "destructive" ? "accent-destructive" : 
      "accent-blue-500";

    return (
      <input
        type="range"
        className={`w-full h-1.5 bg-black/10 dark:bg-black/30 border border-black/5 dark:border-white/5 rounded-lg appearance-none cursor-pointer ${colorClass} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
RangeSlider.displayName = "RangeSlider"
