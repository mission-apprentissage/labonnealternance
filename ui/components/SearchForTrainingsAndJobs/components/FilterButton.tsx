import { Button, Checkbox } from "@chakra-ui/react"
import React from "react"

import { focusWithin } from "@/theme/theme-lba-tools"

const FilterButton = ({ type, count, isActive, handleFilterButtonClicked }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    handleFilterButtonClicked(type)
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
    background: "none",
    marginRight: "5px",
    height: "auto",
    fontWeight: "400",
    paddingY: "0.3rem",
    borderRadius: "40px",
    _hover: {
      background: "none",
    },
    _focus: {
      background: "none",
      outline: "none !important",
      boxShadow: "none",
    },
    _active: {
      background: "none",
    },
  }

  return (
    <Checkbox as="div" tabIndex={-1} {...focusWithin} spacing={3} mr={5} isChecked={isActive} onChange={handleClick}>
      <Button px="0" {...buttonProperties} onClick={handleClick}>
        {getText()}
      </Button>
    </Checkbox>
  )
}

export default FilterButton
