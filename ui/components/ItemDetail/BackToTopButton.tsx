"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useEffect, useState } from "react"

export function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible((window.scrollY || document.documentElement.scrollTop) > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!visible) return null

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: fr.spacing("6v"),
        right: fr.spacing("6v"),
        zIndex: 10,
      }}
    >
      <Button
        iconId="fr-icon-arrow-up-line"
        priority="primary"
        size="medium"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="retour haut de page"
        title="Retour en haut de page"
      />
    </Box>
  )
}
