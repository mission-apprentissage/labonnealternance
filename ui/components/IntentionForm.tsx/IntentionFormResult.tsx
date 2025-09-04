import { Box, Typography } from "@mui/material"
import { ApplicationIntention } from "shared/constants/application"

export const IntensionFormResult = ({ intention, canceled = false }: { intention: ApplicationIntention; canceled?: boolean }) => {
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", width: "80%", maxWidth: "992px", margin: "auto", pt: 12, alignItems: "center", textAlign: "center" }}
      data-testid="IntentionFormConclusion"
    >
      {canceled ? (
        <>
          <Typography variant="h3">C'est noté ! Aucune réponse ne sera envoyée au candidat.</Typography>
          <Typography sx={{ fontSize: "20px", pt: 4 }}>
            Pensez toutefois à revenir plus tard pour lui répondre. Les réponses des recruteurs permettent aux candidats d'y voir plus clair pour leurs futures candidatures.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h3">Merci d&apos;avoir pris le temps d&apos;envoyer un message au candidat.</Typography>
          {intention === ApplicationIntention.ENTRETIEN ? (
            <Typography sx={{ fontSize: "20px", pt: 4 }}>Il dispose désormais de vos coordonnées pour poursuivre l&apos;échange.</Typography>
          ) : (
            <Typography sx={{ fontSize: "20px", pt: 4 }}>
              Cela permet aux futurs alternants de comprendre les raisons du refus, et de s&apos;améliorer pour leurs prochaines candidatures.
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}
