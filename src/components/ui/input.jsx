import React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-white px-3.5 py-2 text-[15px] text-gray-900 ring-offset-background transition-[border-color,box-shadow] duration-200 hover:border-gray-400 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
