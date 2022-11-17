import React from "react"

const ExternalLink = ({ url, title, className = "", withPic, picPosition = "right", dataTestid }) => {
  const getPic = (position = "right") => {
    let res = ""
    const samePos = picPosition === position
    if (withPic && samePos) {
      if (position === "left") {
        res = <>{withPic} </>
      } else {
        res = <> {withPic}</>
      }
    }
    return res
  }

  return (
    <a className={className} target="_blank" rel="noopener noreferrer" href={url} data-testid={dataTestid}>
      {getPic("left")}
      {title}
      {getPic("right")}
    </a>
  )
}

export default ExternalLink
