"use client"

import { fr } from "@codegouvfr/react-dsfr"
import type { SxProps, Theme } from "@mui/material"
import { Box } from "@mui/material"
import type { Virtualizer } from "@tanstack/react-virtual"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { RefObject } from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { scrollToVirtualItem } from "@/app/(candidat)/(recherche)/recherche/_utils/scrollToVirtualItem"

type VirtualElement = { height?: number; render: () => React.ReactNode; onRender?: () => void }

export function VirtualContainer({
  elements: rawElements,
  defaultHeight,
  parentStyle,
  containerStyle,
  scrollElementRef,
  virtualizerRef,
  useWindowScroll = false,
  scrollPaddingStart = 0,
  initialScrollIndex = -1,
  onInitialScrollDone,
}: {
  defaultHeight: number
  elements: (VirtualElement | React.ReactNode)[]
  parentStyle?: SxProps<Theme>
  containerStyle?: SxProps<Theme>
  scrollElementRef?: RefObject<HTMLElement>
  virtualizerRef?: RefObject<Virtualizer<any, Element>>
  useWindowScroll?: boolean
  scrollPaddingStart?: number
  initialScrollIndex?: number
  onInitialScrollDone?: () => void
}) {
  const lastScrolledIndexRef = useRef<number | null>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollElementRef) {
      scrollElementRef.current = useWindowScroll ? (document.documentElement as HTMLElement) : parentRef.current
    }
  }, [scrollElementRef, useWindowScroll])

  const elements: VirtualElement[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    return rawElements.map((value) => (typeof value === "object" && "render" in value ? value : ({ render: () => value } as VirtualElement)))
  }, [rawElements])

  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    if (useWindowScroll && parentRef.current) {
      setScrollMargin(parentRef.current.offsetTop)
    }
  }, [useWindowScroll])

  const columnVirtualizer = useVirtualizer({
    count: elements.length + 1,
    getScrollElement: () => (useWindowScroll ? document.documentElement : parentRef.current),
    estimateSize: (index) => {
      return elements[index]?.height ?? defaultHeight
    },
    overscan: 10,
    scrollMargin,
    scrollPaddingStart,
    ...(useWindowScroll && {
      scrollToFn: (offset, { behavior }) => {
        window.scrollTo({ top: offset, behavior })
      },
    }),
  })

  useEffect(() => {
    virtualizerRef.current = columnVirtualizer
  })

  useEffect(() => {
    if (initialScrollIndex < 0) return
    if (!useWindowScroll) return
    if (lastScrolledIndexRef.current === initialScrollIndex) return

    // En strict mode (dev), useEffect tourne deux fois. On assigne la ref dans le
    // callback du setTimeout pour que le premier run (nettoyé) ne bloque pas le second.
    let cancelRefine: (() => void) | undefined
    const timer = setTimeout(() => {
      lastScrolledIndexRef.current = initialScrollIndex
      cancelRefine = scrollToVirtualItem({
        virtualizer: columnVirtualizer,
        index: initialScrollIndex,
        offsetTop: scrollPaddingStart,
        behavior: "auto",
        onComplete: onInitialScrollDone,
      })
    }, 0)

    return () => {
      clearTimeout(timer)
      cancelRefine?.()
    }
  }, [initialScrollIndex, useWindowScroll, scrollPaddingStart, columnVirtualizer, onInitialScrollDone])

  const virtualItems = columnVirtualizer.getVirtualItems()
  return (
    <Box
      ref={parentRef}
      className="VirtualContainer"
      sx={{
        ...(useWindowScroll
          ? { width: "100%" }
          : {
              overflow: "auto",
              height: "100%",
              width: "100%",
              contain: "strict",
              flex: 1,
            }),
        ...parentStyle,
      }}
    >
      <Box
        sx={{
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
              transform: `translateY(${(virtualItems[0]?.start ?? 0) - scrollMargin}px)`,
              mt: { xs: 0, md: fr.spacing("4v") },
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
