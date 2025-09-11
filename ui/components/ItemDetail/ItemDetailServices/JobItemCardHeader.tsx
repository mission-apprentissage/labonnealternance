import { Typography } from "@mui/material"
import { ILbaItemJobsGlobal } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

const detailActivityProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: 3,
  paddingBottom: "0",
  textAlign: "left",
  color: "grey.600",
}

interface JobItemCardHeaderProps {
  selectedItem: ILbaItemJobsGlobal
  kind: LBA_ITEM_TYPE
  isMandataire: boolean
  isCollapsedHeader?: boolean
}

export default function JobItemCardHeader({ selectedItem, kind, isMandataire, isCollapsedHeader = undefined }: JobItemCardHeaderProps) {
  let res = <></>
  const companyName = selectedItem?.company?.name

  if (!isCollapsedHeader) {
    if (kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && isMandataire) {
      res = (
        <Typography component="p" sx={{ ...detailActivityProperties, my: 1 }}>
          <Typography component="span" sx={{ fontWeight: 400 }}>
            Le centre de formation&nbsp;
          </Typography>
          <Typography component="span">{companyName}</Typography>
          <Typography component="span" sx={{ fontWeight: 400 }}>
            &nbsp;propose actuellement cette offre dans le domaine suivant
          </Typography>
        </Typography>
      )
    }

    if ([LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA].includes(kind) && !isMandataire) {
      res = (
        <Typography component="p" sx={{ ...detailActivityProperties, my: 1 }}>
          {companyName ? (
            <>
              <Typography component="span">{companyName}</Typography>
              <Typography component="span" sx={{ fontWeight: 400 }}>
                &nbsp;recherche un.e alternant.e pour le poste suivant :
              </Typography>
            </>
          ) : (
            <>
              <Typography component="span" sx={{ fontWeight: 400 }}>
                {selectedItem.nafs.length > 0 && "label" in selectedItem.nafs ? (
                  <>
                    {/** @ts-expect-error: TODO */}
                    Une société du secteur&nbsp;<strong>{selectedItem.nafs[0].label}</strong>&nbsp;propose actuellement cette offre
                  </>
                ) : (
                  "Une société ayant souhaité garder l'anonymat propose actuellement cette offre"
                )}
              </Typography>
            </>
          )}
        </Typography>
      )
    }

    if (kind === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
      res = (
        <Typography component="p" sx={{ ...detailActivityProperties, my: 1 }}>
          <Typography component="span">{companyName}</Typography>
          <Typography component="span" sx={{ fontWeight: 400 }}>
            &nbsp;a des salariés qui exercent le métier auquel vous vous destinez. Envoyez votre candidature spontanée !
          </Typography>
        </Typography>
      )
    }
  }

  return res
}
