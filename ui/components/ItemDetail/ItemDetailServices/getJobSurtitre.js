import { Text } from "@chakra-ui/react"
import React from "react"

const detailActivityProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: 3,
  paddingBottom: "0",
  textAlign: "left",
  color: "grey.600",
}

export default function getJobSurtitre({ selectedItem, kind, isMandataire, isCollapsedHeader }) {
  let res = ""
  let companyName = selectedItem?.company?.name || ""

  if (!isCollapsedHeader) {
    if (kind === "matcha" && isMandataire) {
      res = (
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

    if (kind === "peJob" || (kind === "matcha" && !isMandataire)) {
      res = (
        <Text as="p" {...detailActivityProperties} mt={2}>
          {companyName ? (
            <>
              <Text as="span">{companyName}</Text>
              <Text as="span" fontWeight={400}>
                &nbsp;propose actuellement cette offre
              </Text>
            </>
          ) : (
            <>
              <Text as="span" fontWeight={400}>
                {selectedItem?.nafs ? (
                  <>
                    Une société du secteur&nbsp;<bold>${selectedItem.nafs[0].label}</bold>&nbsp;propose actuellement cette offre
                  </>
                ) : (
                  "Une société ayant souhaité garder l'anonymat"
                )}
              </Text>
            </>
          )}
        </Text>
      )
    }

    if (kind === "lbb" || kind === "lba") {
      res = (
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
