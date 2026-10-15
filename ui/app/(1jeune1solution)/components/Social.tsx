import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import NextImage from "next/image"
import { DsfrIcon } from "@/components/DsfrIcon"
import illustrationLba from "@/public/images/1j1s/illustration-lba.svg"

export default function Social({ utmParams }: { utmParams: string }) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          color: "#000091",
          gap: fr.spacing("10v"),
          background: "#A9FB68",
          mt: { md: fr.spacing("8v") },
          pl: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 },
          pr: { xs: fr.spacing("3v"), md: 0 },
        }}
      >
        <Box sx={{ flex: 1, px: { xs: fr.spacing("3v"), md: fr.spacing("6v") }, py: fr.spacing("4v") }}>
          <Typography sx={{ mb: fr.spacing("6v"), fontSize: "32px", fontWeight: 700, lineHeight: "40px" }}>À chacun sa solution.</Typography>
          <Typography sx={{ mb: fr.spacing("6v"), fontSize: "24px", fontWeight: 700, lineHeight: "32px" }}>
            Vous avez entre 15 et 30 ans ? Découvrez toutes les solutions pour votre avenir !
          </Typography>
          <Button
            linkProps={{ href: `https://www.1jeune1solution.gouv.fr/?${utmParams}` }}
            size="large"
            priority="tertiary"
            style={{ fontSize: "16px", background: "#FFF", marginTop: fr.spacing("2v"), border: "1px solid #DDD" }}
          >
            Visiter le site 1jeune1solution.gouv.fr
          </Button>
        </Box>
        {/* Image en position absolue : la hauteur du bandeau suit le texte et l'image déborde au-dessus,
            dans l'espace réservé par le mt du bandeau. */}
        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            position: "relative",
            flex: "0 1 539px",
            "& > img": { position: "absolute", bottom: 0, right: 0, width: "100%", height: "auto" },
          }}
        >
          <NextImage src="/images/1j1s/personna_10_26.png" alt="" aria-hidden="true" width={539} height={299} unoptimized />
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
        <Box sx={{ flex: 1, p: fr.spacing("6v"), display: "flex", flexDirection: "column", gap: fr.spacing("4v"), background: "#000091" }}>
          <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF", lineHeight: "30px" }}>
            Retrouvez 1jeune1solution sur
            <br />
            Instagram et Tiktok&nbsp;:
          </Typography>
          <Box
            sx={{
              "& > a:hover": { background: "#000091" },
              "& .fr-btn::after": {
                display: "none",
              },
              "& .fr-btn": {
                whiteSpace: { xs: "wrap", sm: "nowrap" },
              },
            }}
          >
            <Button
              linkProps={{
                href: `https://www.instagram.com/1jeune1solution/?${utmParams}`,
                // RGAA 6.1 : deux liens voisins affichent « @1jeune1solution ». L'aria-label les
                // distingue, il doit donc commencer par cet intitulé visible pour rester atteignable
                // à la commande vocale.
                "aria-label": "@1jeune1solution - compte Instagram de 1jeune1solution",
              }}
              size="large"
              priority="tertiary"
              style={{ color: "#FFFFFF", fontSize: "16px" }}
            >
              @1jeune1solution <DsfrIcon style={{ marginLeft: "8px", marginRight: "-3px" }} name="fr-icon-instagram-fill" size={24} />
            </Button>
          </Box>
          <Box
            sx={{
              "& > a:hover": { background: "#000091" },
              "& .fr-btn::after": {
                display: "none",
              },
              "& .fr-btn": {
                whiteSpace: { xs: "wrap", sm: "nowrap" },
              },
            }}
          >
            <Button
              linkProps={{
                href: `https://www.tiktok.com/@1jeune_1solution/?${utmParams}`,
                "aria-label": "@1jeune1solution - compte Tiktok de 1jeune1solution",
              }}
              size="large"
              priority="tertiary"
              style={{ color: "#FFFFFF", fontSize: "16px" }}
            >
              @1jeune1solution <DsfrIcon style={{ marginLeft: "8px", marginRight: "-3px" }} name="fr-icon-tiktok-fill" size={24} />
            </Button>
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: "flex", flexDirection: { xs: "column", lg: "row" }, background: "#EEDBF5", maxHeight: { xs: "unset", sm: "280px" } }}>
          <Box sx={{ flex: 1, p: fr.spacing("6v"), alignItems: "top", display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
            <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#000091", lineHeight: "30px" }}>
              Suivez La bonne alternance sur Linkedin pour rester informé de nos actualités&nbsp;:
            </Typography>
            <Box sx={{ "& > a:hover": { background: "#EEDBF5" }, "& > a": { whiteSpace: { xs: "wrap", sm: "nowrap" } } }}>
              <Box
                sx={{
                  "& .fr-btn::after": {
                    display: "none",
                  },
                  "& .fr-btn": {
                    whiteSpace: { xs: "wrap", sm: "nowrap" },
                  },
                }}
              >
                <Button
                  linkProps={{
                    href: `https://www.linkedin.com/company/la-bonne-alternance/?${utmParams}`,
                    "aria-label": "LinkedIn La bonne alternance - compte LinkedIn de La bonne alternance",
                  }}
                  size="large"
                  priority="secondary"
                  style={{ color: "#000091", fontSize: "16px" }}
                >
                  LinkedIn La bonne alternance <DsfrIcon style={{ marginLeft: "8px", marginRight: "-3px" }} name="fr-icon-linkedin-box-fill" size={24} />
                </Button>
              </Box>
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
