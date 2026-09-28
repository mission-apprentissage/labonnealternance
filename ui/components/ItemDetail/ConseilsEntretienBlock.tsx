import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Stack, Typography } from "@mui/material"
import Image from "next/image"

const CONSEILS_ENTRETIEN_URL = "https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"

/**
 * Encart « Psst ! » renvoyant vers les conseils de préparation à l'entretien.
 * Rendu à l'identique en bas des quatre fiches offre : LBA, CFA, GEIQ et partenaire.
 */
export function ConseilsEntretienBlock() {
  return (
    <Stack spacing={2} direction="row" sx={{ alignItems: "center", my: fr.spacing("6v"), mx: { xs: 2, sm: 2, md: "auto" } }}>
      <Image src="/images/whisper.svg" alt="" aria-hidden={true} width={34} height={39} style={{ marginTop: "2px" }} />
      <Box>
        <Typography component="div" sx={{ fontWeight: 700, fontSize: "20px", color: "#3a3a3a" }}>
          Psst !
        </Typography>
        <Box sx={{ color: "grey.700" }}>
          Pour convaincre l'entreprise de vous embaucher,{" "}
          <Link href={CONSEILS_ENTRETIEN_URL} target="_blank" rel="noopener noreferrer" underline="always">
            on vous donne des conseils ici pour vous aider !<span className="fr-sr-only"> - nouvelle fenêtre</span>
          </Link>
        </Box>
      </Box>
    </Stack>
  )
}
