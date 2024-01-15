import { Box, Checkbox } from "@chakra-ui/react"

const FilterButton = ({ type, count, isActive, handleFilterButtonClicked }) => {
  const handleClick = (e) => {
    e.preventDefault()
    handleFilterButtonClicked(type)
  }

  const getText = () => {
    switch (type) {
      case "trainings":
        return `Formations (${count})`

      case "jobs":
        return `Entreprises (${count})`

      case "all":
        return `Tout (${count})`

      case "duo":
        return `Partenariats (${count})`

      default:
        return ""
    }
  }

  return (
    <Checkbox spacing={3} mr={5} isChecked={isActive} onChange={handleClick}>
      <Box onClick={handleClick}>{getText()}</Box>
    </Checkbox>
  )
}

export default FilterButton
