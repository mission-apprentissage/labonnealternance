import { Box, Text, Textarea, Button, Link, FormErrorMessage, FormControl } from "@chakra-ui/react"

/**
 * @description CfaCandidatInformationAnswered component.
 * @returns {JSX.Element}
 */
export const CfaCandidatInformationAnswered = (props) => {
  console.log("")
  console.log("---------------props")
  console.log(props)

  function getCurrentDate(separator = "/") {
    let newDate = new Date()
    let date = newDate.getDate()
    let month = newDate.getMonth() + 1
    let year = newDate.getFullYear()
    return `${year}${separator}${month < 10 ? `0${month}` : `${month}`}${separator}${date}`
  }

  function getCurrentHourMinute(separator = "h") {
    let newDate = new Date()
    let minutes = newDate.getMinutes()
    let hour = newDate.getHours()
    return `${hour}${separator}${minutes < 10 ? `0${minutes}` : `${minutes}`}`
  }

  return (
    <>
      <Box mt={8} p={6} backgroundColor="#F5F5FE;">
        <Text as="h2" fontWeight="700" color="#000091" fontSize="22px" lineHeight="36px">
          Votre réponse au candidat
        </Text>
        <Text as="p" mt="8" fontWeight="700" color="#1E1E1E" fontSize="18px" lineHeight="28px">
          Votre réponse a été envoyée !
        </Text>
        <Text as="p" fontWeight="700" color="#666666" fontSize="16px" lineHeight="24px">
          Réponse envoyée le {getCurrentDate()} à {getCurrentHourMinute()}
        </Text>
        <Text as="p" mt="8" fontWeight="400" color="#929292" fontSize="16px" lineHeight="24px">
          {props.msg}
        </Text>
      </Box>
    </>
  )
}
