import { Box, Flex } from "@chakra-ui/react"

const rayonMap = {
  10: "10km",
  30: "30km",
  60: "60km",
  100: "100km",
}

export function buildRayonsOptions() {
  return (
    <>
      {Object.keys(rayonMap).map((key) => {
        return (
          <option key={key} value={key}>
            {rayonMap[key]}
          </option>
        )
      })}
    </>
  )
}

const buttonProperties = {
  border: "1px solid",
  borderColor: "grey.400",
  marginTop: "2px",
  width: "fit-content",
  borderRadius: "40px",
  cursor: "pointer",
  marginRight: ["0.6rem", "0.2rem"],
  padding: ["0.1rem 0.5rem", "0.3rem 1rem"],
  fontSize: ["12px", "16px"],
  lineHeight: ["16px", "24px"],
}

export function buildRayonsButtons(locationRadius, onClickCallback) {
  return (
    <Flex>
      {Object.keys(rayonMap).map((key) => {
        return (
          <Box
            key={key}
            value={key}
            {...buttonProperties}
            color={locationRadius?.toString() === key ? "white" : "grey.750"}
            background={locationRadius?.toString() === key ? "blue" : "white"}
            onClick={(evt) => {
              evt.currentTarget.value = key
              onClickCallback(evt, key)
            }}
          >
            {`${key} km`}
          </Box>
        )
      })}
    </Flex>
  )
}
