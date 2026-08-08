import type { DsfrHeadProps } from "@codegouvfr/react-dsfr/next-app-router/server-only-index"
import { createGetHtmlAttributes, DsfrHeadBase } from "@codegouvfr/react-dsfr/next-app-router/server-only-index"
import Link from "next/link"

import { defaultColorScheme } from "./default-color-scheme"

export const { getHtmlAttributes } = createGetHtmlAttributes({ defaultColorScheme })

export function DsfrHead(props: DsfrHeadProps) {
  return <DsfrHeadBase Link={Link} {...props} />
}
