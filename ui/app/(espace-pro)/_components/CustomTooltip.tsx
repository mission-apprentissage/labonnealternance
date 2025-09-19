import { Box } from "@mui/material"
import React, { CSSProperties, useEffect, useRef, useState } from "react"

export const CustomTooltip = ({
  children,
  tooltipContent,
  id,
  width = 400,
  backgroundColor = "white",
  relativePosY = -10,
  relativePosX = 15,
}: {
  children: React.ReactNode
  tooltipContent: React.ReactNode
  id: string
  width?: number
  backgroundColor?: string
  relativePosY?: number
  relativePosX?: number
}) => {
  const [offsetX, setOffsetX] = useState(0)
  const tooltipContentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!tooltipContentRef.current) return
    const rect = tooltipContentRef.current.getBoundingClientRect()
    const { left } = rect
    if (left < 0) {
      setOffsetX(-left)
    }
  }, [setOffsetX])
  const finalX = relativePosX + offsetX

  const tooltipId = `${id}-tooltip`

  const beforeAfterProps: CSSProperties = {
    opacity: 0,
    pointerEvents: "none",
    transition: "all 0.5s ease",
  }

  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        position: "relative",
        lineHeight: 0,

        ".tooltip-container": {
          cursor: "pointer",

          "::after": {
            ...beforeAfterProps,
            position: "absolute",
            top: relativePosY,
            left: finalX,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid #7b7b7b`,
            content: "' '",
            fontSize: 0,
            lineHeight: 0,
            marginLeft: "-5px",
            width: 0,
          },

          "& + .tooltip-content": {
            ...beforeAfterProps,
            position: "absolute",
            transform: `translate(0, calc(-100% + ${relativePosY}px))`,
            left: -width / 2 + finalX,
            backgroundColor,
            border: "solid 1px #c0c0c0",
            borderRadius: "4px",
            textTransform: "none",
            transition: "opacity 0.5s ease",
            width: width,
            zIndex: 100,
            boxShadow: "0 4px 12px 0 #00001229",
          },
          ":hover, :focus": {
            "& + .tooltip-content": {
              opacity: 1,
            },
            "::after": {
              opacity: 1,
            },
          },
        },
      }}
    >
      <Box component="span" aria-describedby={tooltipId} className="tooltip-container">
        {children}
      </Box>
      <Box ref={tooltipContentRef} component="span" id={tooltipId} role="tooltip" className="tooltip-content">
        {tooltipContent}
      </Box>
    </Box>
  )
}
