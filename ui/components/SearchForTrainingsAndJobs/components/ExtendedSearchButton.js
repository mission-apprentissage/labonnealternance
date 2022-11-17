import React, { useContext } from "react"
import { ScopeContext } from "../../../context/ScopeContext"

const ExtendedSearchButton = ({ title, hasJob, handleExtendedSearch }) => {
  const handleClick = async () => {
    handleExtendedSearch()
  }

  const scopeContext = useContext(ScopeContext)

  const gtmClass = function () {
    let res = ""
    if (hasJob == "true") {
      res = "gtmExtendSelect gtmExtendSelectHasJob"
    } else if (hasJob == "false") {
      res = "gtmExtendSelect gtmExtendSelectNoJob"
    }
    return res
  }

  return scopeContext.isJob ? (
    <button className={`${gtmClass()} btn btn-lg btn-dark c-regular-darkbtn my-3`} onClick={handleClick}>
      {title}
    </button>
  ) : (
    ""
  )
}

export default ExtendedSearchButton
