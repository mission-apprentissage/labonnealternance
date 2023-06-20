import { useEffect, useState } from "react"
import { _get, _put } from "../../../../common/httpClient"
import { Box, Text, Checkbox, Flex, Button, useToast } from "@chakra-ui/react"
import { Check } from "../../../../theme/components/icons"
/**
 * @description Updates all widgetParameters to updates referrers.
 * @returns {JSX.Element}
 */
const UpdateAllParameterReferrers = () => {
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [isSubmitDisabled, setSubmitDisabled] = useState(true)
  const [referrers, setReferrers] = useState()
  const toast = useToast()

  /**
   * @description Get all parameters.
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const referrersResponse = await getReferrers()

        setReferrers(referrersResponse.map((referrer) => ({ ...referrer, isChecked: false })))
      } catch (error) {
        toast({
          title: "Une erreur est survenue durant la récupération des informations.",
          status: "error",
          isClosable: true,
          position: "bottom-right",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  /**
   * @description Returns all referrers.
   * @returns {Promise<{code: {number}, name: {string}, full_name: {string}, url: {string}[]}>}
   */
  const getReferrers = async () => {
    const { referrers } = await _get(`/api/constants`)

    return referrers
  }

  /**
   * @description Toggles checkboxes.
   * @param {Number} referrerCode
   * @param {Boolean} isChecked
   * @returns {void}
   */
  const toggleReferrer = (referrerCode, isChecked) => {
    const referrersUpdated = referrers.map((referrer) => {
      if (referrer.code === referrerCode) {
        referrer.isChecked = isChecked
      }

      return referrer
    })

    setReferrers(referrersUpdated)
    toggleDisableButton()
  }

  /**
   * @description Disable submit button if no one of checkbox is checked.
   * @returns {void}
   */
  const toggleDisableButton = () => {
    const uncheckedReferrers = referrers.filter((referrer) => !referrer.isChecked)

    setSubmitDisabled(uncheckedReferrers.length === referrers.length)
  }

  /**
   * @description Submit.
   * @returns {Promise<void>}
   */
  const submit = async () => {
    try {
      setSubmitLoading(true)
      await _put("/api/widget-parameters/referrers", {
        referrers: referrers.filter((referrer) => referrer.isChecked).map((referrer) => referrer.code),
      })
      toast({
        title: "Enregistrement effectué avec succès.",
        status: "success",
        isClosable: true,
        position: "bottom-right",
      })
    } catch (error) {
      toast({
        title: "Une erreur est survenue.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Box w={["100%", "100%", "40%", "40%"]} boxShadow="0 1px 2px 0 rgb(0 0 0 / 5%)" border="1px solid rgba(0,40,100,.12)" border-radius="3px" mt={10}>
      <Text fontSize="15px" p={5} borderBottom="1px solid rgba(0,40,100,.12)" border-radius="3px">
        Modifier les sources de parution pour tous les paramètres actifs
      </Text>
      <Box active={loading} loader p={5}>
        <Text>
          Veuillez cocher l'ensemble des plateformes de diffusion sur lesquelles vous souhaitez que les formations actuellement publiées soient accessibles.
          <br />
          <br />
          {referrers &&
            referrers.map((referrer) => (
              <Flex>
                <Checkbox key={referrer.code} checked={referrer.checked} icon={<Check w="20px" h="18px" />} onChange={() => toggleReferrer(referrer.code, !referrer.isChecked)}>
                  <Text ml={2}>{referrer.full_name}</Text>
                </Checkbox>
              </Flex>
            ))}
        </Text>
      </Box>
      <Flex justifyContent="flex-end" borderTop="1px solid rgba(0,40,100,.12)" border-radius="3px" p={5} mt="12.6rem">
        <Button
          bg={isSubmitDisabled === true ? "" : "#467fcf"}
          disabled={isSubmitDisabled}
          loading={submitLoading}
          onClick={submit}
          variant="primary"
          mr="3rem"
          _hover={{ bg: "#3057BE" }}
        >
          Enregistrer
        </Button>
      </Flex>
    </Box>
  )
}

export { UpdateAllParameterReferrers }
