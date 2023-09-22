import React, { useEffect } from "react"

import { scrollToTop } from "../../utils/tools"

const ScrollToTop = ({ elementId = undefined }) => {
  useEffect(() => {
    scrollToTop(elementId)
  })
  return <></>
}

export default ScrollToTop
