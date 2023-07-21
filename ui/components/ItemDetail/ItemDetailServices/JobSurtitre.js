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

const Content = ({ selectedItem, kind, isMandataire }) => {
  let companyName = selectedItem?.company?.name || ""
  const {
    job: { isActive },
    nafs,
  } = selectedItem ?? {}
  const [firstNaf] = nafs

  if (!isActive) {
    return <b>Cette offre n'est plus disponible</b>
  }

  if (kind === "matcha" && isMandataire) {
    return (
      <>
        <b>Le centre de formation&nbsp;</b>
        {companyName}
        <b>&nbsp;propose actuellement cette offre dans le domaine suivant</b>
      </>
    )
  }

  if (kind === "peJob" || (kind === "matcha" && !isMandataire)) {
    if (companyName) {
      return (
        <>
          {companyName}
          <b>&nbsp;propose actuellement cette offre</b>
        </>
      )
    } else if (firstNaf) {
      return (
        <b>
          Une société du secteur&nbsp;<bold>{firstNaf.label}</bold>&nbsp;propose actuellement cette offre
        </b>
      )
    } else {
      return <b>{"Une société ayant souhaité garder l'anonymat propose actuellement cette offre"}</b>
    }
  }

  if (kind === "lbb" || kind === "lba") {
    return (
      <>
        {companyName}
        <b>&nbsp;a des salariés qui exercent le métier auquel vous vous destinez. Envoyez votre candidature spontanée !</b>
      </>
    )
  }

  return null
}

export const JobSurtitre = (props) => {
  return (
    <Text as="p" {...detailActivityProperties} mt={2}>
      <Content {...props} />
    </Text>
  )
}
