import React from "react"

import briefcaseIcon from "../../public/images/briefcase.svg"

const TagOffreAssociee = () => {
  return (
    <span className="c-media-tag c-media-tag--briefcase">
      <img src={briefcaseIcon} alt="" />
      <span className="ml-1">Offre associée</span>
    </span>
  )
}

export default TagOffreAssociee
