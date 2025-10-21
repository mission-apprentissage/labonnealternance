import { Box, Typography } from "@mui/material"
import { ApplicationIntention } from "shared/constants/application"

export const IntensionPageResult = ({ intention, canceled = false }: { intention: ApplicationIntention; canceled?: boolean }) => {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", width: "80%", maxWidth: "992px", margin: "auto", pt: "80px", alignItems: "center", textAlign: "center" }}
      data-testid="IntentionFormConclusion"
    >
      {canceled ? (
        <>
          <Typography fontSize="22px" marginBottom="24px" fontWeight={700}>
            C’est noté ! Aucune réponse ne sera envoyée au candidat.
          </Typography>
          <Typography sx={{ fontSize: "18px", lineHeight: "28px", maxWidth: "555px" }}>
            Pensez toutefois à revenir plus tard pour lui répondre. Les réponses des recruteurs permettent aux candidats d’y voir plus clair pour leurs futures candidatures.
          </Typography>
        </>
      ) : (
        <>
          <Typography fontSize="22px" fontWeight={700} maxWidth="555px">
            Merci beaucoup d’avoir pris le temps d’envoyer un commentaire au candidat.
          </Typography>
          {intention === ApplicationIntention.ENTRETIEN ? (
            <Typography sx={{ fontSize: "18px", lineHeight: "28px", marginTop: "12px" }}>Il dispose désormais de vos coordonnées pour poursuivre l'échange.</Typography>
          ) : (
            <Typography sx={{ fontSize: "18px", lineHeight: "28px", marginTop: "24px", maxWidth: "555px" }}>
              Cela permet aux futurs alternants de comprendre les raisons du refus, et de s’améliorer pour leurs prochaines candidatures.
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}
