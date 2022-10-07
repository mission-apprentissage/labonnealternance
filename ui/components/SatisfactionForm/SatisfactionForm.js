import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import submitCommentaire from "./services/submitCommentaire.js";
import SatisfactionFormSuccess from "./SatisfactionFormSuccess.js";
import SatisfactionFormNavigation from "./SatisfactionFormNavigation.js";
import { isNonEmptyString } from "../../utils/strutils";

import { getValueFromPath } from "../../utils/tools";
import { testingParameters } from "../../utils/testingParameters";
import { useRouter } from "next/router";

let iv = null;
let id = null;
let intention = null;

const SatisfactionForm = ({ formType }) => {
  const initParametersFromPath = () => {
    iv = getValueFromPath("iv");
    id = getValueFromPath("id");
    intention = getValueFromPath("intention");
  };

  const readIntention = () => {
    const router = useRouter();
    const { intention } = router?.query ? router.query : { intention: "intention" };
    return intention;
  };

  const getFeedbackText = () => {
    const router = useRouter();
    const { intention, fn, ln } = router?.query ? router.query : { intention: "intention", fn: "prénom", ln: "nom" };
    let firstName = fn;
    let lastName = ln;
    let text = (
      <div className="mb-4">
        <p className="pt-4">Merci beaucoup pour votre réponse.</p>
        {intention === "entretien" ? (
          <div>
            <strong>Vous avez indiqué accepter la candidature de {`${firstName} ${lastName}`}.</strong>
            <p className="pt-4 pb-0 mb-0">
              Planifiez une date de rencontre avec le candidat, en lui envoyant un message personnalisé.
            </p>
            <p>
              <small className="satisfaction-smallhint">
                Le candidat recevra votre message ainsi que vos coordonnées directement sur sa boîte mail.
              </small>
            </p>
          </div>
        ) : (
          ""
        )}
        {intention === "ne_sais_pas" ? (
          <div>
            <strong>Vous avez indiqué temporiser la candidature de {`${firstName} ${lastName}`}.</strong>
            <p className="pt-4 pb-0 mb-0">
              Précisez au candidat votre intérêt pour sa candidature, en lui envoyant un message personnalisé.
            </p>
            <p>
              <small className="satisfaction-smallhint">
                Le candidat recevra votre message ainsi que vos coordonnées directement sur sa boîte mail.
              </small>
            </p>
          </div>
        ) : (
          ""
        )}
        {intention === "refus" ? (
          <div>
            <strong>Vous avez indiqué refuser la candidature de {`${firstName} ${lastName}`}.</strong>
            <p className="pt-4 pb-0 mb-0">
              Précisez les raisons de votre refus au candidat, en lui envoyant un message personnalisé.
            </p>
            <p>
              <small className="satisfaction-smallhint">
                Le candidat recevra votre message directement sur sa boîte mail.
              </small>
            </p>
          </div>
        ) : (
          ""
        )}
      </div>
    );

    return text;
  };

  useEffect(() => {
    // enregistrement en state des params provenant du path
    initParametersFromPath();
  }, []);

  const [sendingState, setSendingState] = useState("not_sent");

  const getValidationSchema = () => {
    const router = useRouter();
    const { intention } = router?.query ? router.query : { intention: "intention" };
    let res = Yup.object({});
    if (intention === "refus") {
      res = Yup.object({
        comment: Yup.string().nullable().required("Veuillez remplir le message"),
      });
    } else {
      res = Yup.object({
        comment: Yup.string().required("Veuillez remplir le message"),
        email: Yup.string().email("⚠ Adresse e-mail invalide.").required("⚠ L'adresse e-mail est obligatoire."),
        phone: Yup.string()
          .matches(/^[0-9]{10}$/, "⚠ Le numéro de téléphone doit avoir exactement 10 chiffres")
          .required("⚠ Le téléphone est obligatoire"),
      });
    }
    return res;
  };

  const formik = useFormik({
    initialValues: { comment: "" },
    validationSchema: getValidationSchema(intention),
    onSubmit: async (formikValues) => {
      await submitCommentaire(
        {
          comment: formikValues.comment,
          phone: formikValues.phone,
          email: formikValues.email,
          id,
          intention,
          iv,
          formType,
        },
        setSendingState
      );
    },
  });

  const getFieldError = () => {
    let errorMsg = "";
    if (formik.touched.comment && formik.errors.comment) {
      errorMsg = <div className="c-candidature-erreur mb-2 visible">{formik.errors.comment}</div>;
    } else if (sendingState === "not_sent_because_of_errors") {
      errorMsg = (
        <div className="c-candidature-erreur mb-2 visible">
          Une erreur technique empêche l'enregistrement de votre avis. Merci de réessayer ultérieurement
        </div>
      );
    } else {
      errorMsg = <div className="c-candidature-erreur invisible">{"pas d'erreur"}</div>;
    }
    return errorMsg;
  };

  const getPlaceHolderText = () => {
    const router = useRouter();
    const { intention } = router?.query ? router.query : { intention: "intention" };
    let res = "";
    if (intention === "ne_sais_pas") {
      res =
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention mais nous ne sommes actuellement pas ...";
    } else if (intention === "entretien") {
      res =
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Votre candidature a retenu toute notre attention et nous souhaiterions échanger avec vous. Seriez-vous disponible le ...";
    } else {
      res =
        "Bonjour, Merci pour l'intérêt que vous portez à notre établissement. Nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre candidature car ...";
    }
    return res;
  };

  const getErrorClassFor = (formikObj, target) => {
    let res = "is-not-validated";
    if (formikObj.errors[target]) {
      res = "is-valid-false";
    } else if (formikObj.values[target]) {
      res = "is-valid-true";
    }
    return res;
  };

  return (
    <div className="c-formulaire-satisfaction">
      <SatisfactionFormNavigation />
      {sendingState !== "ok_sent" ? (
        <div className="container flex-center">
          <div className="row flex-center py-5">
            <div className="col col-lg-7 mx-auto">
              {getFeedbackText()}
              {isNonEmptyString(readIntention()) ? (
                <form onSubmit={formik.handleSubmit} className="">
                  <fieldset
                    data-testid="fieldset-message"
                    className={`pt-2 c-candidature-field ${getErrorClassFor(formik, "comment")}`}
                  >
                    <textarea
                      id="comment"
                      data-testid="comment"
                      name="comment"
                      placeholder={`${getPlaceHolderText()}`}
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      value={formik.values.comment}
                    />
                  </fieldset>
                  {getFieldError()}

                  {readIntention() !== "refus" ? (
                    <div className="c-candidature-personaldata d-flex flex-column flex-md-row justify-content-between">
                      <div>
                        <fieldset
                          data-testid="fieldset-email"
                          className={`mt-1 mt-md-0 mr-0 mr-md-3 c-candidature-field ${getErrorClassFor(
                            formik,
                            "email"
                          )}`}
                        >
                          <label htmlFor="email">E-mail *</label>
                          <input
                            id="email"
                            className="w-100"
                            data-testid="email"
                            name="email"
                            type="email"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.email || ""}
                          />
                          {formik.errors.email ? (
                            <div className="c-candidature-erreur visible">{formik.errors.email}</div>
                          ) : (
                            <div className="c-candidature-erreur invisible">{"pas d'erreur"}</div>
                          )}
                          {testingParameters?.simulatedRecipient ? (
                            <div>Les emails seront envoyés à {testingParameters.simulatedRecipient}</div>
                          ) : (
                            ""
                          )}
                        </fieldset>
                      </div>

                      <div>
                        <fieldset
                          data-testid="fieldset-phone"
                          className={`mt-1 mt-md-0 c-candidature-field ${getErrorClassFor(formik, "phone")}`}
                        >
                          <label htmlFor="email">Téléphone *</label>
                          <input
                            id="phone"
                            className="w-100"
                            data-testid="phone"
                            name="phone"
                            type="text"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.phone || ""}
                          />
                          {formik.errors.phone ? (
                            <div className="c-candidature-erreur visible">{formik.errors.phone}</div>
                          ) : (
                            <div className="invisible">{"pas d'erreur"}</div>
                          )}
                        </fieldset>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}

                  <div className="d-flex flex-row-reverse">
                    <button
                      aria-label="envoyer-le-message"
                      className={`btn btn-dark btn-dark-action c-satisfaction-submit mt-3`}
                      type="submit"
                    >
                      {"Envoyer le message"}
                    </button>
                  </div>
                </form>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      ) : (
        <SatisfactionFormSuccess />
      )}
    </div>
  );
};

export default SatisfactionForm;
