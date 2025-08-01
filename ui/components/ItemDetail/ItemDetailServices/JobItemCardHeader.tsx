import { Text } from "@chakra-ui/react"
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
        // @ts-expect-error: TODO
        <Text as="p" {...detailActivityProperties} my={1}>
          <Text as="span" fontWeight={400}>
            Le centre de formation&nbsp;
          </Text>
          <Text as="span">{companyName}</Text>
          <Text as="span" fontWeight={400}>
            &nbsp;propose actuellement cette offre dans le domaine suivant
          </Text>
        </Text>
      )
    }

    if ([LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA].includes(kind) && !isMandataire) {
      res = (
        // @ts-expect-error: TODO
        <Text as="p" {...detailActivityProperties} my={1}>
          {companyName ? (
            <>
              <Text as="span">{companyName}</Text>
              <Text as="span" fontWeight={400}>
                &nbsp;recherche un.e alternant.e pour le poste suivant :
              </Text>
            </>
          ) : (
            <>
              <Text as="span" fontWeight={400}>
                {selectedItem?.nafs ? (
                  <>
                    {/* @ts-expect-error: TODO */}
                    Une société du secteur&nbsp;<bold>{selectedItem.nafs[0].label}</bold>&nbsp;propose actuellement cette offre
                  </>
                ) : (
                  "Une société ayant souhaité garder l'anonymat propose actuellement cette offre"
                )}
              </Text>
            </>
          )}
        </Text>
      )
    }

    if (kind === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
      res = (
        // @ts-expect-error: TODO
        <Text as="p" {...detailActivityProperties} my={1}>
          <Text as="span">{companyName}</Text>
          <Text as="span" fontWeight={400}>
            &nbsp;a des salariés qui exercent le métier auquel vous vous destinez. Envoyez votre candidature spontanée !
          </Text>
        </Text>
      )
    }
  }

  return res
}
