import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import NextImage from "next/image"
import illustrationLba from "@/public/images/1j1s/illustration-lba.svg"

export default function Social() {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "#FFFFFF",
          gap: fr.spacing("10v"),
          background: "#566BB1",
          pl: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 },
          pr: { xs: fr.spacing("3v"), md: 0 },
        }}
      >
        <Box sx={{ flex: 1, px: { xs: fr.spacing("3v"), md: fr.spacing("6v") }, py: fr.spacing("4v") }}>
          <Typography sx={{ fontSize: { xs: "28px", md: "32px" }, fontWeight: 700, lineHeight: { xs: "36px", md: "40px" } }}>À chacun sa solution.</Typography>
          <Typography sx={{ fontSize: { xs: "22px", md: "24px" }, fontWeight: 700, lineHeight: { xs: "28px", md: "32px" } }}>
            Vous avez entre 15 et 30 ans ? Découvrez toutes les solutions pour votre avenir !
          </Typography>
          <Button
            linkProps={{ href: "https://www.1jeune1solution.gouv.fr/" }}
            size="large"
            priority="tertiary"
            style={{ fontSize: "16px", background: "#FFF", marginTop: fr.spacing("2v") }}
          >
            Visiter le site 1jeune1solution.gouv.fr
          </Button>
        </Box>
        <Box sx={{ display: { xs: "none", md: "block" }, maxHeight: 229, overflow: "hidden" }}>
          <NextImage src="/images/1j1s/jeunes.webp" alt="" aria-hidden="true" width={460} height={229} unoptimized />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: { xs: fr.spacing("3v"), md: fr.spacing("11v") },
          px: { xs: fr.spacing("3v"), md: 0 },
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: { xs: "column", sm: "row" }, background: "#000091", maxHeight: { xs: "unset", sm: "280px" } }}>
          <Box sx={{ flex: 1, p: fr.spacing("6v"), display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
            <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF", lineHeight: "30px" }}>Retrouvez 1jeune1solution sur Instagram et Tiktok :</Typography>
            <Box sx={{ "& > a:hover": { background: "#000091" } }}>
              <Button
                linkProps={{
                  href: "https://www.instagram.com/1jeune1solution/",
                  target: "_self",
                  "aria-label": "Lien vers le compte Instagram de 1jeune1solution",
                }}
                size="large"
                priority="tertiary"
                iconId="fr-icon-instagram-fill"
                iconPosition="right"
                style={{ color: "#FFFFFF", fontSize: "16px" }}
              >
                @1jeune1solution
              </Button>
            </Box>
            <Box sx={{ "& > a:hover": { background: "#000091" } }}>
              <Button
                linkProps={{
                  href: "https://www.tiktok.com/@1jeune_1solution",
                  target: "_self",
                  "aria-label": "Lien vers le compte Tiktok de 1jeune1solution",
                }}
                size="large"
                priority="tertiary"
                iconId="fr-icon-tiktok-fill"
                iconPosition="right"
                style={{ color: "#FFFFFF", fontSize: "16px" }}
              >
                @1jeune1solution
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: "relative",
              bottom: { xs: 0, sm: 0, md: 3 },
              right: { xs: -1, sm: 0, md: -1 },
              overflow: { xs: "hidden", md: "visible" },
              maxHeight: { xs: "150px", sm: "unset" },
              textAlign: "right",
            }}
          >
            <NextImage src="/images/1j1s/jeune-garcon.webp" alt="" aria-hidden="true" width={220} height={284} unoptimized />
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: "flex", flexDirection: { xs: "column", lg: "row" }, background: "#EEDBF5", maxHeight: { xs: "unset", sm: "280px" } }}>
          <Box sx={{ flex: 1, p: fr.spacing("6v"), alignItems: "top", display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
            <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#000091", lineHeight: "30px" }}>
              Suivez La bonne alternance sur Linkedin pour rester informé de nos actualités :
            </Typography>
            <Box sx={{ "& > a:hover": { background: "#EEDBF5" }, "& > a": { whiteSpace: { xs: "wrap", sm: "nowrap" } } }}>
              <Button
                linkProps={{
                  href: "https://www.linkedin.com/company/la-bonne-alternance/",
                  target: "_self",
                  "aria-label": "Lien vers le compte LinkedIn de La bonne alternance",
                }}
                size="large"
                priority="secondary"
                iconId="fr-icon-linkedin-box-fill"
                iconPosition="right"
                style={{ color: "#000091", fontSize: "16px" }}
              >
                LinkedIn La bonne alternance
              </Button>
            </Box>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center", overflow: "hidden", mt: { xs: "-5px", lg: fr.spacing("10v") }, "& > img": { maxWidth: "100%", height: "auto" } }}>
            <NextImage src={illustrationLba.src} alt="" aria-hidden="true" width={illustrationLba.width} height={illustrationLba.height} unoptimized />
          </Box>
        </Box>
      </Box>
    </>
  )
}
