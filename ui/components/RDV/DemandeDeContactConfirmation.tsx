import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { BarberGuy } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

export const DemandeDeContactConfirmation = ({ appointmentId, token }: { appointmentId: string; token: string }) => {
  const { isPending, data } = useQuery({
    queryKey: ["/appointment-request/context/short-recap", appointmentId],
    queryFn: () =>
      apiGet("/appointment-request/context/short-recap", {
        querystring: { appointmentId },
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
  })
  if (isPending) return null

  return (
    <div>
      <Box sx={{ mb: fr.spacing("6v"), display: "flex", alignItems: "center" }}>
        <Box component="img" src="/images/paperplane2.svg" aria-hidden={true} alt="" sx={{ mr: fr.spacing("4v") }} />
        <Typography variant="h4" data-testid="DemandeDeContactConfirmationTitle">
          Voilà une bonne chose de faite {data.user.firstname} {data.user.lastname} !
        </Typography>
      </Box>
      <Box sx={{ mb: fr.spacing("6v") }}>
        <Typography sx={{ fontWeight: 700, color: "grey.750" }}>
          {data.formation.etablissement_formateur_raison_sociale.toUpperCase()} pourra donc vous contacter au{" "}
          <Typography component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.actionHigh.blueCumulus.default }}>
            {data.user.phone.match(/.{1,2}/g).join(".")}
          </Typography>{" "}
          ou sur{" "}
          <Typography component="span" sx={{ fontWeight: 700, color: fr.colors.decisions.text.actionHigh.blueCumulus.default }}>
            {data.user.email}
          </Typography>{" "}
          pour répondre à vos questions.
        </Typography>
      </Box>
      <Typography sx={{ mb: fr.spacing("6v") }}>Vous allez recevoir un email de confirmation de votre demande de contact sur votre adresse email.</Typography>
      <Box sx={{ display: "flex", backgroundColor: "#F9F8F6" }}>
        <Box sx={{ width: "100px", px: "40px", py: "16px" }}>
          <BarberGuy sx={{ width: "34px", height: "38px" }} />
        </Box>
        <Box sx={{ mt: "12px", pb: "24px", pr: "10px" }}>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, mt: "6px" }}>
            Psst, nous avons une{" "}
            <Box component="span" sx={{ color: fr.colors.decisions.text.actionHigh.blueCumulus.default }}>
              info pour vous !
            </Box>
          </Typography>
          <Typography sx={{ fontSize: "16px", mt: "12px" }}>
            <b>Pour préparer votre premier contact avec le centre formation,</b> répondez à notre quiz{" "}
            <DsfrLink href="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987" aria-label="Prendre contact avec une école - nouvelle fenêtre">
              Prendre contact avec une école
            </DsfrLink>
          </Typography>
        </Box>
      </Box>
    </div>
  )
}
