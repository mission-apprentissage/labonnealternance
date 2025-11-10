import { Box } from "@mui/material"
import Image from "next/image"

import { CustomTag, customTagColors } from "./CustomTag"
import type { CustomTagColor } from "./CustomTag"

export const LbaItemTag = ({
  children,
  iconClassName,
  iconImageUri,
  color,
}: {
  children: React.ReactNode
  iconClassName?: string
  iconImageUri?: string
  color: CustomTagColor
}) => {
  const iconColor = customTagColors[color].color
  return (
    <CustomTag
      color={color}
      icon={
        iconClassName ? (
          <Box
            component="span"
            sx={{
              "&:before": {
                "--icon-size": "10px",
                color: iconColor,
              },
            }}
            className={iconClassName}
            aria-hidden="true"
          />
        ) : iconImageUri ? (
          <Image style={{ display: "inline-block", color: iconColor }} width={16} height={16} src={iconImageUri} alt="" />
        ) : undefined
      }
    >
      {children}
    </CustomTag>
  )
}
