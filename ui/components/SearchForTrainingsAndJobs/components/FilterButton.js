import { Button } from "@chakra-ui/react"
import React from "react"
import ReactHtmlParser from "react-html-parser"

const FilterButton = ({ type, count, isActive, handleFilterButtonClicked }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    if (!isActive) handleFilterButtonClicked(type)
  }

  const getText = () => {
    let res = ""
    if (type === "trainings") {
      res = `Formations (${count})`
    } else if (type === "jobs") {
      res = `Entreprises (${count})`
    } else if (type === "all") {
      res = `Tout (${count})`
    } else if (type === "duo") {
      res = `Partenariats (${count})`
    }
    return res
  }

  const buttonProperties = {
    lineHeight: "24px",
    width: "fit-content",
    fontSize: "14px",
    outline: "none",
    border: "none",
    marginRight: "5px",
    height: "auto",
    paddingY: "0.3rem",
    borderRadius: "40px",
    whiteSpace: "pre-wrap",
    _hover: {
      background: "none",
    },
    _focus: {
      background: "none",
    },
  }

  return (
    <Button px={["0.3rem", "1rem", "1rem", "0.3rem", "1rem"]} {...buttonProperties} onClick={handleClick}>
      {ReactHtmlParser(getText())}
    </Button>
  )
}

export default FilterButton
