import React from "react"

import paperplaneIcon from "../../public/images/paperplane.svg"

const TagCandidatureSpontanee = () => {
  return (
    <span className="c-media-tag c-media-tag--paperplane">
      <img src={paperplaneIcon} alt="" />
      <span className="ml-1">Candidature spontanée</span>
    </span>
  )
}

export default TagCandidatureSpontanee
