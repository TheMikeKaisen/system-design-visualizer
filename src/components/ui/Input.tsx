import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex w-full text-xs bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-500 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
