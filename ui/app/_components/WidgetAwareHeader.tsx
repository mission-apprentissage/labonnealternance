"use client"

import { PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { useIsWidget } from "@/app/hooks/useIsWidget"

/**
 * Affiche le header public LBA, sauf en mode widget (page embarquée en iframe),
 * où la navigation LBA ne doit pas apparaître.
 */
export function WidgetAwareHeader() {
  const isWidget = useIsWidget()
  return isWidget ? null : <PublicHeaderStatic />
}
