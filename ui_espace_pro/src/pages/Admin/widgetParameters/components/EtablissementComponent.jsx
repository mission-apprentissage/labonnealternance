import { createRef, useState, useEffect } from "react";
import { EmailIcon } from "@chakra-ui/icons";
import * as PropTypes from "prop-types";
import "react-dates/initialize";
import { SingleDatePicker } from "react-dates";
import "react-dates/lib/css/_datepicker.css";
import * as moment from "moment";
import {
  Box,
  Text,
  Flex,
  EditablePreview,
  EditableInput,
  Editable,
  Button,
  Grid,
  Tag,
  Tooltip,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Table,
  Thead,
  Th,
  Tr,
  Tbody,
  Td,
} from "@chakra-ui/react";
import { Disquette } from "../../../../theme/components/icons";
import { _get, _put } from "../../../../common/httpClient";
import { dayjs, formatDate } from "../../../../common/dayjs";
import { emailStatus } from "../constants/email";

/**
 * @description Etablissement component.
 * @param {string} id
 * @returns {JSX.Element}
 */
const EtablissementComponent = ({ id }) => {
  const emailDecisionnaireFocusRef = createRef();
  const emailDecisionnaireRef = createRef();

  const [loading, setLoading] = useState(false);
  const [optModeLoading, setOptModeLoading] = useState(false);
  const [etablissement, setEtablissement] = useState();
  const [optInActivatedAt, setOptInActivatedAt] = useState();
  const [focused, setFocused] = useState();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const optModes = {
    OPT_IN: "Opt-In",
    OPT_OUT: "Opt-Out",
  };

  /**
   * @description Initial fetching.
   * @return {Promise<void>}
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await _get(`/api/admin/etablissements/${id}`);
      setEtablissement(response);
      setOptInActivatedAt(moment(response.opt_in_activated_at));
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
  };

  /**
   * @description Returns toast common error for etablissement updates.
   * @return {string | number}
   */
  const putError = () =>
    toast({
      title: "Une erreur est survenue durant l'enregistrement.",
      status: "error",
      isClosable: true,
      position: "bottom-right",
    });

  /**
   * @description Call succes Toast.
   * @return {string | number}
   */
  const putSuccess = () =>
    toast({
      title: "Enregistrement effectué avec succès.",
      status: "success",
      isClosable: true,
      position: "bottom-right",
    });

  useEffect(() => fetchData(), []);

  /**
   * @description Update "opt-in" activated.
   * @param {Date} date
   * @return {Promise<void>}
   */
  const updateOptInActivedDate = async (date) => {
    try {
      setOptInActivatedAt(moment(date));
      const response = await _put(`/api/admin/etablissements/${etablissement._id}`, {
        opt_in_activated_at: dayjs(date).format("YYYY-MM-DD"),
        opt_mode: "OPT_IN",
      });
      setEtablissement(response);
      putSuccess();
    } catch (error) {
      putError();
    }
  };

  /**
   * @description Upserts "email_decisionnaire"
   * @param {string} email
   * @return {Promise<void>}
   */
  const upsertEmailDecisionnaire = async (email) => {
    try {
      const response = await _put(`/api/admin/etablissements/${etablissement._id}`, { email_decisionnaire: email });
      setEtablissement(response);
      putSuccess();
    } catch (error) {
      putError();
    }
  };

  /**
   * @description Enable Opt-in.
   * @returns {Promise<void>}
   */
  const enableOptIn = async () => {
    try {
      setOptModeLoading(true);
      await _put(`/api/admin/etablissements/${etablissement._id}`, { opt_mode: "OPT_IN" });
      window.location.reload(false);
    } catch (error) {
      putError();
    } finally {
      setOptModeLoading(false);
    }
  };

  /**
   * @description Enable opt-out.
   * @returns {string | number}
   */
  const enableOptOut = async () => {
    try {
      setOptModeLoading(true);
      const response = await _put(`/api/admin/etablissements/${etablissement._id}`, {
        opt_mode: "OPT_OUT",
        opt_out_will_be_activated_at: dayjs().add(15, "days").format(),
      });
      setEtablissement(response);
    } catch (error) {
      putError();
    } finally {
      setOptModeLoading(false);
    }
  };

  return (
    <Box bg="white" border="1px solid #E0E5ED" borderRadius="4px" mt={10} pb="5" loading={loading}>
      <Box borderBottom="1px solid #E0E5ED">
        <Text fontSize="16px" p={5}>
          Etablissement
          <Text as="span" fontSize="16px" float="right" onClick={onOpen}>
            <EmailIcon cursor="pointer" fontSize={30} />
          </Text>
        </Text>
      </Box>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5">
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Raison sociale <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.raison_sociale}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            SIRET Formateur <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.siret_formateur}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            SIRET Gestionnaire <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.siret_gestionnaire}
            </Text>
          </Text>
        </Box>
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Adresse
            <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.adresse}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Localité <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.localite}
            </Text>
          </Text>
        </Box>
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            Code postal <br />
            <br />
            <Text as="span" fontWeight="400">
              {etablissement?.code_postal}
            </Text>
          </Text>
        </Box>
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        <Box w="100%" h="10">
          <Text textStyle="sm" fontWeight="600">
            OPT Mode <br />
            <br />
            {etablissement?.opt_mode === null ? (
              <>
                <Tooltip label="Activer toutes les formations qui ont un mail de contact catalogue." key="opt-in">
                  <Button variant="primary" fontSize="12px" size="sm" onClick={enableOptIn} isDisabled={optModeLoading}>
                    Activer l'opt-in
                  </Button>
                </Tooltip>
                <Tooltip
                  label="Activer l'opt-out pour cet établissement. Un email décisionnaire doit être renseigné."
                  key="opt-out"
                >
                  <Button
                    variant="primary"
                    fontSize="12px"
                    size="sm"
                    ml="5"
                    onClick={enableOptOut}
                    isDisabled={!etablissement?.email_decisionnaire || optModeLoading}
                    _hover={false}
                  >
                    Activer l'opt-out
                  </Button>
                </Tooltip>
              </>
            ) : (
              <Tag bg="#467FCF" size="md" color="white" key="activate">
                {optModes[etablissement?.opt_mode]}
              </Tag>
            )}
          </Text>
        </Box>
        {etablissement?.opt_in_activated_at && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Opt-In activated date <br />
              <br />
              <SingleDatePicker
                isOutsideRange={() => false}
                date={optInActivatedAt}
                onDateChange={updateOptInActivedDate}
                focused={focused}
                onFocusChange={({ focused }) => setFocused(focused)}
                displayFormat={"DD/MM/YYYY"}
                numberOfMonths={1}
              />
            </Text>
          </Box>
        )}
        {etablissement?.opt_out_invited_at && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Date d'invitation à l'opt-out <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.opt_out_invited_at).format("DD/MM/YYYY")}
              </Tag>
            </Text>
            <Modal isOpen={isOpen} onClose={onClose} size={"full"}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Détails des emails</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Box>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Campagne</Th>
                          <Th>Statut</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {etablissement?.mailing.map((mail) => (
                          <Tr>
                            <Td>{formatDate(mail?.webhook_status_at) || formatDate(mail.email_sent_at)}</Td>
                            <Td>{mail.campaign}</Td>
                            <Td>{emailStatus[mail.status] || "Envoyé"}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Fermer
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Box>
        )}
        {etablissement?.opt_out_will_be_activated_at && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Date d'activation des formations
              <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.opt_out_will_be_activated_at).format("DD/MM/YYYY")}
              </Tag>
            </Text>
          </Box>
        )}
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        {etablissement?.opt_out_refused_at && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Date de refus de l'opt-out
              <br />
              <br />
              <Tag bg="#467FCF" size="md" color="white">
                {dayjs(etablissement?.opt_out_refused_at).format("DD/MM/YYYY")}
              </Tag>
            </Text>
          </Box>
        )}
        {etablissement?.opt_out_question && (
          <Box w="100%" h="10">
            <Text textStyle="sm" fontWeight="600">
              Question posée sur l'opt-out
              <br />
              <br />
              <Text fontWeight="normal">{etablissement?.opt_out_question}</Text>
            </Text>
          </Box>
        )}
      </Grid>
      <Grid templateColumns="repeat(3, 1fr)" gap={5} p="5" pt="10">
        <Box onClick={() => emailDecisionnaireFocusRef.current.focus()}>
          <Text textStyle="sm" fontWeight="600">
            Email décisionnaire <br />
            <br />
          </Text>
          <Flex>
            <Editable
              defaultValue={etablissement?.email_decisionnaire}
              key={etablissement?.email_decisionnaire || "email_decisionnaire"}
              style={{
                border: "solid #dee2e6 1px",
                padding: 5,
                marginRight: 10,
                borderRadius: 4,
                minWidth: "70%",
              }}
            >
              <EditablePreview ref={emailDecisionnaireFocusRef} />
              <EditableInput ref={emailDecisionnaireRef} type="email" _focus={{ border: "none" }} />
            </Editable>
            <Button
              RootComponent="a"
              variant="primary"
              onClick={() => upsertEmailDecisionnaire(emailDecisionnaireRef.current.value.toLowerCase())}
            >
              <Disquette w="16px" h="16px" />
            </Button>
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
};

EtablissementComponent.propTypes = {
  id: PropTypes.string.isRequired,
};

export default EtablissementComponent;
