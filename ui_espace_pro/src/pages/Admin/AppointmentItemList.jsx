import { useState } from "react";
import { Tr, Td, Text, Button, Textarea, Tooltip, Tag } from "@chakra-ui/react";
import { _put } from "../../common/httpClient";
import { formatDate, dayjs } from "../../common/dayjs";

/**
 * @description Row table component.
 * @param {Object} props
 * @param {Object} props.appointment
 * @returns {JSX.Element}
 */
export const AppointmentItemList = (props) => {
  const [showEditionMode, setShowEditionMode] = useState(false);
  const [cfaAPrisContact, setCfaAPrisContact] = useState(props.appointment.cfa_pris_contact_candidat);
  const [champsLibreStatut, setChampsLibreStatut] = useState(props.appointment.champs_libre_status || "");
  const [champsLibreCommentaires, setChampsLibreCommentaires] = useState(
    props.appointment.champs_libre_commentaire || ""
  );

  /**
   * @description Updates appointment.
   * @param appointmentId
   * @returns {Promise<*>}
   */
  const editAppointment = (appointmentId) =>
    _put(`/api/appointment/${appointmentId}`, {
      cfa_pris_contact_candidat: cfaAPrisContact,
      champs_libre_status: champsLibreStatut,
      champs_libre_commentaire: champsLibreCommentaires,
    });

  const canCelModeEdition = () => {
    setCfaAPrisContact(props.appointment.cfa_pris_contact_candidat);
    setChampsLibreStatut(props.appointment.champs_libre_status || "");
    setChampsLibreCommentaires(props.appointment.champs_libre_commentaire || "");
  };

  const handleOnClick = (event, buttonName) => {
    event.preventDefault();
    switch (buttonName) {
      case "buttonEdit":
        setShowEditionMode(true);
        break;
      case "buttonValidate":
        setShowEditionMode(false);
        editAppointment(props.appointment._id);
        break;
      case "buttonCancel":
        setShowEditionMode(false);
        canCelModeEdition();
        break;
      default:
        break;
    }
  };

  return (
    <Tr id={props.appointment._id} _hover={{ bg: "#f4f4f4", transition: "0.5s" }} transition="0.5s">
      <Td>{formatDate(props.appointment.created_at)}</Td>
      <Td>
        {props.appointment.candidat.firstname} {props.appointment.candidat.lastname}
      </Td>
      <Td color="#295a9f" _hover={{ textDecoration: "underline" }}>
        <a href={`tel:${props.appointment.candidat.phone}`} color="#295a9f">
          {props.appointment.candidat.phone}
        </a>
      </Td>
      <Td color="#295a9f" _hover={{ textDecoration: "underline" }}>
        <a href={`mailto:${props.appointment.candidat.email}`}>{props.appointment.candidat.email}</a>
      </Td>
      <Td color="#295a9f" _hover={{ textDecoration: "underline" }}>
        <a href={`mailto:${props.appointment.email_cfa}`}>{props.appointment.email_cfa}</a>
      </Td>
      <Td>{props.appointment.formation.etablissement_formateur_entreprise_raison_sociale}</Td>
      <Td>{props.appointment.etablissement_id}</Td>
      <Td>{props.appointment.formation.intitule_long}</Td>
      <Td>{props.appointment.formation_id}</Td>
      <Td>
        {!props.appointment.appointment?.candidat_contacted_at && (
          <Tag bg="grey.500" size="md" ml={2} color="white">
            N/A
          </Tag>
        )}
        {props.appointment.etablissement?.opt_mode && (
          <Tag bg="greenmedium.500" size="md" ml={2} color="white">
            Oui
          </Tag>
        )}
      </Td>
      <Td>
        {props.appointment.etablissement?.opt_mode === "OPT_IN" && (
          <Tag bg="bluesoft.600" size="md" ml={2} color="white">
            Opt-In
          </Tag>
        )}
        {props.appointment.etablissement?.opt_mode === "OPT_OUT" && (
          <Tag bg="bluesoft.600" size="md" ml={2} color="white">
            Opt-Out
          </Tag>
        )}
        {!props.appointment.etablissement?.opt_mode && (
          <Tag bg="grey.500" size="md" ml={2} color="white">
            N/C
          </Tag>
        )}
      </Td>
      <Td>
        {props.appointment.etablissement?.opt_mode === "OPT_IN" && (
          <> {dayjs(props.appointment.etablissement?.opt_in_activated_at).format("DD/MM/YYYY")} </>
        )}
        {props.appointment.etablissement?.opt_mode === "OPT_OUT" && (
          <> {dayjs(props.appointment.etablissement?.opt_out_activated_at).format("DD/MM/YYYY")} </>
        )}
        {!props.appointment.etablissement?.opt_mode && "N/C"}
      </Td>
      <Td>
        <Text>{props.appointment.referrer.full_name}</Text>
      </Td>
      <Td>
        <Tooltip
          hasArrow
          label={`Envoi: ${
            formatDate(props.appointment.email_premiere_demande_candidat_date) || "N/C"
          } / Dernier statut: ${
            dayjs.utc(props.appointment.email_premiere_demande_cfa_statut_date).format("DD/MM/YYYY HH:mm:ss") || "N/C"
          }`}
          bg="gray.300"
          color="black"
        >
          {props.appointment.email_premiere_demande_candidat_statut}
        </Tooltip>
      </Td>
      <Td>
        <Tooltip
          hasArrow
          label={`Envoi: ${formatDate(props.appointment.email_premiere_demande_cfa_date) || "N/C"} / Dernier statut: ${
            dayjs.utc(props.appointment.email_premiere_demande_cfa_statut_date).format("DD/MM/YYYY HH:mm:ss") || "N/C"
          }`}
          bg="gray.300"
          color="black"
        >
          {props.appointment.email_premiere_demande_cfa_statut}
        </Tooltip>
      </Td>
      <Td>
        <Textarea type="text" disabled minH="0">
          {props.appointment.motivations}
        </Textarea>
      </Td>
      <Td>
        <Textarea
          minH="0"
          type="text"
          disabled={!showEditionMode}
          onChange={(event) => setChampsLibreStatut(event.target.value)}
        >
          {champsLibreStatut}
        </Textarea>
      </Td>
      <Td>
        <Textarea
          minH="0"
          type="text"
          disabled={!showEditionMode}
          onChange={(event) => setChampsLibreCommentaires(event.target.value)}
        >
          {champsLibreCommentaires}
        </Textarea>
      </Td>
      <Td>
        <>
          {!showEditionMode && (
            <Button variant="primary" onClick={(event) => handleOnClick(event, "buttonEdit")}>
              Passer en mode édition
            </Button>
          )}
          {showEditionMode && (
            <>
              <Button variant="primary" onClick={(event) => handleOnClick(event, "buttonValidate")}>
                Valider
              </Button>
              <Button
                ml={5}
                bg="white"
                color="#485056"
                border="1px solid #E0E5ED"
                borderRadius="4px"
                fontWeight="600"
                fontSize="12px"
                onClick={(event) => handleOnClick(event, "buttonCancel")}
              >
                Annuler les modifications
              </Button>
            </>
          )}
        </>
      </Td>
    </Tr>
  );
};
