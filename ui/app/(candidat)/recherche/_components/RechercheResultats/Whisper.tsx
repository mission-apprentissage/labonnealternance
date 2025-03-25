import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import type { IWhisper } from "@/app/(candidat)/recherche/_hooks/useWhispers"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type WhisperProps = {
  whisper: IWhisper
}

export function Whisper({ whisper }: WhisperProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gap: fr.spacing("2w"),
        my: fr.spacing("3w"),
      }}
    >
      <Image width={34} height={39} src="/images/whisper.svg" alt="" unoptimized />
      <Box sx={{ display: "grid", gap: fr.spacing("1w") }}>
        <Typography className={fr.cx("fr-text--lead", "fr-text--bold")}>
          Psst, nous avons une{" "}
          <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
            info pour vous !
          </Box>
        </Typography>
        <Typography className={fr.cx("fr-text--sm")}>{whisper.message}</Typography>
        {whisper.lien !== null && (
          <Box>
            <DsfrLink href={whisper.lien} external aria-label="Accéder au détail de l'astuce">
              En savoir plus
            </DsfrLink>
          </Box>
        )}
      </Box>
    </Box>
  )
}
