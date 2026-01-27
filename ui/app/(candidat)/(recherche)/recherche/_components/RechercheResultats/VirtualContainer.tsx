"use client"

import type { SxProps, Theme } from "@mui/material"
import { Box } from "@mui/material"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Virtualizer } from "@tanstack/react-virtual"
import type { RefObject } from "react"
import { useEffect, useMemo, useRef } from "react"

type VirtualElement = { height?: number; render: () => React.ReactNode; onRender?: () => void }

export function VirtualContainer({
  elements: rawElements,
  defaultHeight,
  parentStyle,
  containerStyle,
  scrollToElementIndex = 0,
  ref,
  virtualizerRef,
}: {
  defaultHeight: number
  elements: (VirtualElement | React.ReactNode)[]
  parentStyle?: SxProps<Theme>
  containerStyle?: SxProps<Theme>
  scrollToElementIndex?: number
  ref?: RefObject<HTMLElement>
  virtualizerRef?: RefObject<Virtualizer<any, Element>>
}) {
  const parentRef = useRef(null)

  useEffect(() => {
    if (ref) {
      ref.current = parentRef.current
    }
  }, [ref])

  const elements: VirtualElement[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return rawElements.map((value) => (typeof value === "object" && "render" in value ? value : ({ render: () => value } as VirtualElement)))
  }, [rawElements])

  const columnVirtualizer = useVirtualizer({
    count: elements.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      return elements[index]?.height ?? defaultHeight
    },
    overscan: 10,
  })

  useEffect(() => {
    virtualizerRef.current = columnVirtualizer
  })

  useEffect(() => {
    virtualizerRef.current.scrollToIndex(Math.max(scrollToElementIndex, 0), { align: "start" })
  }, [scrollToElementIndex])

  const virtualItems = columnVirtualizer.getVirtualItems()
  return (
    <Box
      ref={parentRef}
      sx={{
        overflow: "auto",
        height: "100%",
        width: "100%",
        contain: "strict",
        flex: 1,
        ...parentStyle,
      }}
    >
      <Box
        sx={{
          maxWidth: "xl",
          height: columnVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
          margin: "auto",
          ...containerStyle,
        }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
            }}
          >
            {virtualItems.flatMap((virtualRow) => {
              const item = elements.at(virtualRow.index)
              if (!item) return []
              item.onRender?.()

              return [
                <Box key={virtualRow.key} data-index={virtualRow.index} ref={columnVirtualizer.measureElement} className="virtual-container-item">
                  {item.render()}
                </Box>,
              ]
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
