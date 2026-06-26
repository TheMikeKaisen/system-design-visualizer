import * as React from "react"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`appearance-none w-full text-xs bg-black/5 dark:bg-black/20 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-lg pl-3 pr-8 py-2 text-foreground placeholder:text-muted-foreground hover:border-black/20 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all cursor-pointer ${className || ""}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"
