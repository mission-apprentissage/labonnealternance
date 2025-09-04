import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { ILbaItemJobsGlobal } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { useLocalStorage } from "@/app/hooks/useLocalStorage"

import { SendPlausibleEvent } from "../../utils/plausible"

interface GoingToContactQuestionProps {
  kind: LBA_ITEM_TYPE
  item: ILbaItemJobsGlobal
}

const GoingToContactQuestion = ({ kind, item }: GoingToContactQuestionProps) => {
  const { storedValue, setLocalStorage } = useLocalStorage(getGoingtoId(kind, item))

  const workplace = kind === LBA_ITEM_TYPE.FORMATION ? "cet établissement" : "cette entreprise"

  const getType = () => {
    if (kind === LBA_ITEM_TYPE.FORMATION) {
      return "formation"
    }
    return "entreprise Algo"
  }

  const typeForEventTracking = getType()

  return (
    <Box
      sx={{
        mt: fr.spacing("3w"),
        p: fr.spacing("2v"),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "white",
        maxWidth: "970px",
        mx: { xs: 0, md: "auto" },
      }}
      data-testid="GoingToContactQuestion"
    >
      <Typography sx={{ fontWeight: 700 }}>Allez-vous contacter {workplace} ?</Typography>
      {storedValue ? (
        <Typography sx={{ fontWeight: 700 }}>Merci pour votre réponse ! 👌</Typography>
      ) : (
        <>
          <Button
            type="button"
            priority="tertiary no outline"
            onClick={() => {
              setLocalStorage(true)
              SendPlausibleEvent(`Clic Je vais contacter - Fiche ${typeForEventTracking}`, {
                info_fiche: item.id,
              })
            }}
          >
            👍 Oui
          </Button>
          <Button
            type="button"
            priority="tertiary no outline"
            onClick={() => {
              setLocalStorage(true)
              SendPlausibleEvent(`Clic Je ne vais pas contacter - Fiche ${typeForEventTracking}`, {
                info_fiche: item.id,
              })
            }}
          >
            👎 Non
          </Button>
        </>
      )}
    </Box>
  )
}

export function getGoingtoId(kind: LBA_ITEM_TYPE_OLD | LBA_ITEM_TYPE, item: ILbaItemJobsGlobal) {
  return `goingto-${kind}-${item.id}`
}

export default GoingToContactQuestion
