"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { domAnimation, LazyMotion } from "motion/react"
import * as motion from "motion/react-m"
import type { ReactNode } from "react"

type Variant = "highlight" | "list" | "watch"

const variantStyles: Record<Variant, { background: string }> = {
  highlight: {
    background: fr.colors.decisions.background.alt.purpleGlycine.default,
  },
  list: {
    background: fr.colors.decisions.background.alt.yellowTournesol.default,
  },
  watch: {
    background: fr.colors.decisions.background.alt.yellowMoutarde.default,
  },
}

export function Callout({ variant = "highlight", children }: { variant?: Variant; children: ReactNode }) {
  const style = variantStyles[variant]
  return (
    <LazyMotion features={domAnimation}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Box
          sx={{
            backgroundColor: style.background,
            borderRadius: "4px",
            p: fr.spacing("6v"),
            my: fr.spacing("6v"),
            color: fr.colors.decisions.text.default.grey.default,
            "& p:last-child": { mb: 0 },
            "& ul": { mb: 0, pl: fr.spacing("4v") },
          }}
        >
          {children}
        </Box>
      </motion.div>
    </LazyMotion>
  )
}
