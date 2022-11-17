import React from "react"

import smileyIcon from "../../public/images/smiley.svg"

const TagCfaDEntreprise = () => {
  return (
    <span className="c-media-tag c-media-tag--smiley">
      <img src={smileyIcon} alt="sourire" />
      <span className="ml-1">CFA d&apos;entreprise</span>
    </span>
  )
}

export default TagCfaDEntreprise
