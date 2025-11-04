import type { SvgIconProps } from "@mui/material"
import { SvgIcon } from "@mui/material"

export function ChevronLeft(props: SvgIconProps) {
  return (
    <SvgIcon sx={{ width: "8px", height: "14px" }} viewBox="0 0 8 14" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.828 7.00072L7.778 11.9507L6.364 13.3647L0 7.00072L6.364 0.636719L7.778 2.05072L2.828 7.00072Z" fill="currentColor" />
    </SvgIcon>
  )
}
