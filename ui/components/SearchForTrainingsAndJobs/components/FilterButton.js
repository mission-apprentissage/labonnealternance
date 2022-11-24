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
    py: "0.3rem",
    borderRadius: "40px",
    whiteSpace: "pre-wrap",
    _hover: {
      boxShadow: "0 0 0 2px primary",
      borderRadius: "15px",
    },
    _focus: {
      boxShadow: "0 0 0 2px primary",
      borderRadius: "15px",
    },
  }

  return (
    <Button
      color={isActive ? "white" : "bluefrance.500"}
      background={isActive ? "bluefrance.500" : "bluefrance.200"}
      px={["0.3rem", "1rem", "1rem", "0.3rem", "1rem"]}
      {...buttonProperties}
      onClick={handleClick}
    >
      {ReactHtmlParser(getText())}
    </Button>
  )
}

export default FilterButton
