import type { HTMLAttributes } from "react";

export const MenubarGroup: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>{children}</div>
  )
}
