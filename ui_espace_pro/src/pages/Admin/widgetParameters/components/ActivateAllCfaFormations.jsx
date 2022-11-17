import { useEffect, useState } from "react";
import * as emailValidator from "email-validator";
import { Box, Text, Input, Checkbox, Flex, Button, useToast } from "@chakra-ui/react";
import { _get, _post } from "../../../../common/httpClient";
import { Check } from "../../../../theme/components/icons";

/**
 * @description Updates all widgetParameters to updates referrers.
 * @returns {JSX.Element}
 */
const ActivateAllCfaFormations = () => {
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isSubmitDisabled, setSubmitDisabled] = useState(true);
  const [referrers, setReferrers] = useState();
  const [email, setEmail] = useState("");
  const [siret, setSiret] = useState("");
  const toast = useToast();

  /**
   * @description Get all parameters.
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const referrersResponse = await getReferrers();

        setReferrers(referrersResponse.map((referrer) => ({ ...referrer, isChecked: false })));
      } catch (error) {
        toast({
          title: "Une erreur est survenue durant la récupération des informations.",
          status: "error",
          isClosable: true,
          position: "bottom-right",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  /**
   * @description Returns all referrers.
   * @returns {Promise<{code: {number}, name: {string}, full_name: {string}, url: {string}[]}>}
   */
  const getReferrers = async () => {
    const { referrers } = await _get(`/api/constants`);

    return referrers;
  };

  /**
   * @description Toggles checkboxes.
   * @param {Number} referrerCode
   * @param {Boolean} isChecked
   * @returns {void}
   */
  const toggleReferrer = (referrerCode, isChecked) => {
    const referrersUpdated = referrers.map((referrer) => {
      if (referrer.code === referrerCode) {
        referrer.isChecked = isChecked;
      }

      return referrer;
    });

    setReferrers(referrersUpdated);
    toggleDisableButton();
  };

  /**
   * @description Disable submit button if no one of checkbox is checked.
   * @returns {void}
   */
  const toggleDisableButton = () => {
    const uncheckedReferrers = referrers.filter((referrer) => !referrer.isChecked);

    setSubmitDisabled(
      uncheckedReferrers.length === referrers.length || !emailValidator.validate(email) || siret.length !== 14
    );
  };

  /**
   * @description Handle "email" changes.
   * @param {Event} event
   * @returns {void}
   */
  const onChangeEmail = (event) => {
    setEmail(event.target.value);
    toggleDisableButton();
  };

  /**
   * @description Handle "siret" changes.
   * @param {Event} event
   * @returns {void}
   */
  const onChangeSiret = (event) => {
    const value = event.target.value;
    if (/^\d+$/.test(value)) {
      setSiret(value);
    }
    toggleDisableButton();
  };

  /**
   * @description Submit.
   * @returns {Promise<void>}
   */
  const submit = async () => {
    try {
      setSubmitLoading(true);
      const { result } = await _post("/api/widget-parameters/import", {
        parameters: [
          {
            siret_formateur: siret,
            email: email,
            referrers: referrers.filter((referrer) => referrer.isChecked).map((referrer) => referrer.code),
          },
        ],
      });

      if (result[0].error) {
        toast({
          title: result[0].error,
          status: "error",
          isClosable: true,
          position: "bottom-right",
        });
      } else {
        setEmail("");
        setSiret("");

        if (result[0].formations.length > 0) {
          toast({
            title: "Enregistrement effectué avec succès.",
            status: "success",
            isClosable: true,
            position: "bottom-right",
          });
        } else {
          toast({
            title: "Aucune modification n'a été apportée.",
            status: "info",
            isClosable: true,
            position: "bottom-right",
          });
        }
      }

      toggleDisableButton();
    } catch (error) {
      toast({
        title: "Une erreur est survenue.",
        status: "error",
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box
      w={["100%", "100%", "40%", "40%"]}
      boxShadow="0 1px 2px 0 rgb(0 0 0 / 5%)"
      border="1px solid rgba(0,40,100,.12)"
      border-radius="3px"
      mt={10}
      ml={[0, 0, 5, 5]}
    >
      <Text fontSize="15px" p={5} borderBottom="1px solid rgba(0,40,100,.12)" border-radius="3px">
        Activer toutes les formations d'un CFA
      </Text>
      <Box active={loading} loader p={5}>
        <Text>
          Veuillez cocher l'ensemble des plateformes de diffusion sur lesquelles vous souhaitez que les formations du
          SIRET formateur fournies soient activés. Ne sont affecté que les formations sans configurations.
          <br />
          <br />
          {referrers &&
            referrers.map((referrer) => (
              <Flex>
                <Checkbox
                  key={referrer.code}
                  checked={referrer.checked}
                  label={referrer.full_name}
                  icon={<Check w="20px" h="18px" />}
                  onChange={() => toggleReferrer(referrer.code, !referrer.isChecked)}
                >
                  <Text ml={2}>{referrer.full_name}</Text>
                </Checkbox>
              </Flex>
            ))}
          <Box mt={5}>
            <Text fontWeight="700" textStyle="sm">
              Siret formateur
            </Text>
            <Input
              mt={3}
              name="siret_formateur"
              placeholder="48398606300012"
              maxLength={14}
              onChange={onChangeSiret}
              value={siret}
            />
          </Box>
          <Box mt={5}>
            <Text fontWeight="700" textStyle="sm">
              Email de contact
            </Text>
            <Input mt={3} name="email_contact" placeholder="exemple@cfa.fr" onChange={onChangeEmail} value={email} />
          </Box>
        </Text>
      </Box>
      <Flex justifyContent="flex-end" borderTop="1px solid rgba(0,40,100,.12)" border-radius="3px" p={5}>
        <Button
          bg={isSubmitDisabled === true ? "tomato" : "#467fcf"}
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
  );
};

export { ActivateAllCfaFormations };
