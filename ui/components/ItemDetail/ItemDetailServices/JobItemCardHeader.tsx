import { Text } from "@chakra-ui/react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

const detailActivityProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: 3,
  paddingBottom: "0",
  textAlign: "left",
  color: "grey.600",
}

export default function JobItemCardHeader({ selectedItem, kind, isMandataire, isCollapsedHeader = undefined }) {
  let res = <></>
  const companyName = selectedItem?.company?.name || ""

  if (!isCollapsedHeader) {
    if (kind === LBA_ITEM_TYPE_OLD.MATCHA && isMandataire) {
      res = (
        // @ts-expect-error: TODO
        <Text as="p" {...detailActivityProperties} mt={2}>
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

    if ([LBA_ITEM_TYPE_OLD.PEJOB, LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE_OLD.PARTNER_JOB].includes(kind) && !isMandataire) {
      res = (
        // @ts-expect-error: TODO
        <Text as="p" {...detailActivityProperties} mt={2}>
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

    if (kind === LBA_ITEM_TYPE_OLD.LBA) {
      res = (
        // @ts-expect-error: TODO
        <Text as="p" {...detailActivityProperties} mt={2}>
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
