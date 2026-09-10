"use client"

import { PublicHeaderStatic } from "@/app/_components/PublicHeader"
import type { ShellName } from "@/app/_components/shell-ids"
import { useIsWidget } from "@/app/hooks/use-is-widget"

/**
 * Affiche le header public LBA, sauf en mode widget (page embarquée en iframe),
 * où la navigation LBA ne doit pas apparaître.
 */
export function WidgetAwareHeader({ shell }: { shell: ShellName }) {
  const isWidget = useIsWidget()
  return isWidget ? null : <PublicHeaderStatic shell={shell} />
}
