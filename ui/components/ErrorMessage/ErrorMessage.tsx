import { Box, Flex, Image, Text } from "@chakra-ui/react"
import React from "react"

const cssParameters = {
  background: "#fff1e5",
  borderRadius: "10px",
  fontWeight: 700,
  margin: "10px",
  padding: "5px",
}

interface Props {
  type?: "column" | undefined
  message: string
}

const ErrorMessage = ({ type = undefined, message }: Props) => {
  return (
    <>
      {type === "column" && <Image width="256px" margin="auto" src="/images/icons/searchingPeople.svg" alt="" />}
      <Flex alignItems="center" {...cssParameters} color="grey.650">
        <Image width="32px" mr={2} src="/images/icons/errorAlert.svg" alt="" />
        {message}
      </Flex>
      {type === "column" && (
        <Box fontSize="18px" fontWeight={700} textAlign="center" margin="auto" maxWidth="75%">
          <Text as="h3" fontSize="22px" mt="30px" mb="20px">
            Pas de panique{" "}
            <Text as="span" color="#f49979">
              !
            </Text>
          </Text>
          Il y a forcément un résultat qui vous attend, veuillez revenir ultérieurement
        </Box>
      )}
    </>
  )
}

export default ErrorMessage
