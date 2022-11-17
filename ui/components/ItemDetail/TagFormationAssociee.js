import React from "react"

import bookIcon from "../../public/images/book.svg"

const TagFormationAssociee = ({ isMandataire }) => {
  return (
    <>
      {isMandataire === true ? (
        <span className="c-media-tag c-media-tag--2nd c-media-tag--smiley">
          <img src={bookIcon} alt="" />
          <span className="ml-1">Formation associée</span>
        </span>
      ) : (
        ""
      )}
    </>
  )
}

export default TagFormationAssociee
