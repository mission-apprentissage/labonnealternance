import { Box } from "@mui/material"
import Image from "next/image"

import { CustomTag, CustomTagColor } from "@/components/SearchForTrainingsAndJobs/components/CustomTag"

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
              },
            }}
            className={iconClassName}
            aria-hidden="true"
          />
        ) : iconImageUri ? (
          <Image style={{ display: "inline-block" }} width={16} height={16} src={iconImageUri} alt="" />
        ) : undefined
      }
    >
      {children}
    </CustomTag>
  )
}
