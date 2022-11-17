import React from "react"

import briefcaseIcon from "../../public/images/briefcase.svg"

const TagOffreEmploi = () => {
  return (
    <span className="c-media-tag c-media-tag--briefcase">
      <img src={briefcaseIcon} alt="" />
      <span className="ml-1">Offre d&apos;emploi</span>
    </span>
  )
}

export default TagOffreEmploi
