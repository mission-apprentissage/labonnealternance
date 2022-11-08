import Sentry from "@sentry/node";
import { ObjectId } from "mongodb";
import { oleoduc, writeData } from "oleoduc";
import path from "path";
import __dirname from "../common/dirname.js";
import { logger } from "../common/logger.js";
import { Application, BonnesBoites, EmailBlacklist } from "../common/model/index.js";
import { decryptWithIV, encryptIdWithIV } from "../common/utils/encryptString.js";
import { manageApiError } from "../common/utils/errorManager.js";
import { prepareMessageForMail } from "../common/utils/fileUtils.js";
import config from "../config.js";
import updateSendinblueBlockedEmails from "../jobs/updateSendinblueBlockedEmails/updateSendinblueBlockedEmails.js";
import { validateCaller } from "./queryValidators.js";
import {
  checkUserApplicationCount,
  validateCompanyEmail,
  validateFeedbackApplication,
  validateFeedbackApplicationComment,
  validateFileContent,
  validatePermanentEmail,
  validateSendApplication,
} from "./validateSendApplication.js";
const currentDirname = __dirname(import.meta.url);

const publicUrl = config.publicUrl;

const matchaApiEndpoint = `https://matcha${config.env === "production" ? "" : "-recette"}.apprentissage.beta.gouv.fr`;

const imagePath = "https://labonnealternance-recette.apprentissage.beta.gouv.fr/images/emails/";

const images = {
  images: {
    //logo: `${config.publicUrl}/images/emails/logo_lba.png`,
    logo: `${imagePath}logo_lba.png`,
    logoRF: `${imagePath}logo_rf.png`,
    icoInfo: `${imagePath}icone_info.png`,
    icoCandidat: `${imagePath}icone_candidat.png`,
    nspp: `${imagePath}nspp.png`,
    utile: `${imagePath}utile.png`,
    pasUtile: `${imagePath}pasUtile.png`,
    neutre: `${imagePath}neutre.png`,
    recrute: `${imagePath}recrute.png`,
    recrutePas: `${imagePath}recrutePas.png`,
    edit: `${imagePath}icone_edit.png`,
    check: `${imagePath}icone_check.png`,
    enveloppe: `${imagePath}icone_enveloppe.png`,
    bin: `${imagePath}icone_bin.png`,
  },
};

const buildUrlOfDetail = (aPublicUrl, aQuery) => {
  let itemId = ((aCompanyType) => {
    if (aCompanyType === "peJob") {
      return aQuery.job_id;
    } else if (aCompanyType === "matcha") {
      return aQuery.job_id;
    } else if (aCompanyType !== "formation") {
      return aQuery.company_siret || "siret";
    }
  })(aQuery.company_type);
  let moreParams = ((aCompanyType) => {
    let res = "";
    if (aCompanyType === "matcha") {
      res = "&utm_source=jecandidate&utm_medium=email&utm_campaign=jecandidaterecruteur";
    }
    return res;
  })(aQuery.company_type);
  let kind = aQuery.company_type;

  return `${aPublicUrl}/recherche-apprentissage?display=list&page=fiche&type=${kind}&itemId=${itemId}${moreParams}`;
};

const initApplication = (query, companyEmail) => {
  let res = new Application({
    applicant_file_name: query.applicant_file_name,
    applicant_email: query.applicant_email.toLowerCase(),
    applicant_first_name: query.applicant_first_name,
    applicant_last_name: query.applicant_last_name,
    applicant_phone: query.applicant_phone,
    message: prepareMessageForMail(query.message),
    company_siret: query.company_siret,
    company_email: companyEmail.toLowerCase(),
    company_name: query.company_name,
    company_naf: query.company_naf,
    company_address: query.company_address,
    company_type: query.company_type,
    job_title: query.job_title,
    job_id: query.job_id,
    caller: query.caller,
    //interet_offres_mandataire: query.interet_offres_mandataire,
  });

  return res;
};

const getApplications = async (qs) => {
  const query = qs && qs.query ? JSON.parse(qs.query) : {};
  const page = qs && qs.page ? qs.page : 1;
  let limit = qs && qs.limit ? parseInt(qs.limit, 10) : 100;

  if (limit > 200) {
    limit = 200;
  }

  const response = await Application.paginate(query, { page, limit, lean: true });
  return {
    data: response.docs,
    pagination: {
      page: response.page,
      result_per_page: limit,
      number_of_page: response.pages,
      total: response.total,
    },
  };
};

const getEmailTemplates = (applicationType) => {
  if (applicationType === "matcha") {
    return {
      candidat: "mail-candidat-matcha",
      entreprise: "mail-candidature",
    };
  } else {
    return {
      candidat: "mail-candidat",
      entreprise: "mail-candidature",
    };
  }
};

const sendApplication = async ({ scan, mailer, query, referer, shouldCheckSecret }) => {
  if (shouldCheckSecret && !query.secret) {
    return { error: "secret_missing" };
  } else if (shouldCheckSecret && query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" };
  } else if (!validateCaller({ caller: query.caller, referer })) {
    return { error: "missing_caller" };
  } else {
    let validationResult = await validateSendApplication({
      fileName: query.applicant_file_name,
      email: query.applicant_email,
      firstName: query.applicant_first_name,
      lastName: query.applicant_last_name,
      phone: query.applicant_phone,
      fileContent: query.applicant_file_content,
    });

    if (validationResult !== "ok") {
      return { error: validationResult };
    }

    validationResult = await validatePermanentEmail({ email: query.applicant_email });

    if (validationResult !== "ok") {
      return { error: validationResult };
    }

    validationResult = await validateFileContent(
      {
        fileName: query.applicant_file_name,
        fileContent: query.applicant_file_content,
      },
      scan
    );

    if (validationResult !== "ok") {
      return { error: validationResult };
    }

    let companyEmail = shouldCheckSecret ? query.company_email : decryptWithIV(query.company_email, query.iv); // utilisation email de test ou decrypt vrai mail crypté
    let cryptedEmail = shouldCheckSecret ? decryptWithIV(query.crypted_company_email, query.iv) : ""; // présent uniquement pour les tests utilisateurs

    validationResult = await validateCompanyEmail({
      companyEmail,
      cryptedEmail,
    });

    if (validationResult !== "ok") {
      return { error: validationResult };
    }

    validationResult = await checkUserApplicationCount(query.applicant_email.toLowerCase());

    if (validationResult !== "ok") {
      return { error: validationResult };
    }

    try {
      let application = initApplication(query, companyEmail);

      let encryptedId = encryptIdWithIV(application.id);

      const emailTemplates = getEmailTemplates(query.company_type);

      const fileContent = query.applicant_file_content;

      const urlOfDetail = buildUrlOfDetail(publicUrl, query);

      const buildTopic = (aCompanyType, aJobTitle) => {
        let res = "Candidature";
        if (aCompanyType === "matcha") {
          res = `Candidature en alternance - ${aJobTitle}`;
        } else {
          res = `Candidature spontanée en alternance`;
        }
        return res;
      };

      // Sends acknowledge email to "candidate" and application email to "company"
      const [emailCandidat, emailCompany] = await Promise.all([
        mailer.sendEmail({
          to: application.applicant_email,
          subject: `Votre candidature chez ${application.company_name}`,
          template: getEmailTemplate(emailTemplates.candidat),
          data: { ...application._doc, ...images, ...encryptedId, publicUrl },
          attachments: [
            {
              filename: application.applicant_file_name,
              path: fileContent,
            },
          ],
        }),
        mailer.sendEmail({
          to: application.company_email,
          subject: buildTopic(application.company_type, application.job_title),
          template: getEmailTemplate(emailTemplates.entreprise),
          data: { ...application._doc, ...images, ...encryptedId, publicUrl, urlOfDetail, matchaApiEndpoint },
          attachments: [
            {
              filename: application.applicant_file_name,
              path: fileContent,
            },
          ],
        }),
      ]);

      application.to_applicant_message_id = emailCandidat.messageId;
      application.to_applicant_message_status = emailCandidat?.accepted?.length ? "accepted" : "rejected";
      if (emailCompany?.accepted?.length) {
        application.to_company_message_id = emailCompany.messageId;
        application.to_company_message_status = "accepted";
      } else {
        logger.info(
          `Application email rejected. applicant_email=${application.applicant_email} company_email=${application.company_email}`
        );
        throw new Error("Application email rejected");
      }

      await application.save();

      return { result: "ok", message: "messages sent" };
    } catch (err) {
      logger.error(`Error sending application. Reason : ${err}`);
      Sentry.captureException(err);
      if (query?.caller) {
        manageApiError({
          error: err,
          api: "applicationV1",
          caller: query.caller,
          errorTitle: "error_sending_application",
        });
      }
      return { error: "error_sending_application" };
    }
  }
};

const saveApplicationFeedback = async ({ query }) => {
  await validateFeedbackApplication({
    id: query.id,
    iv: query.iv,
    avis: query.avis,
  });

  let decryptedId = decryptWithIV(query.id, query.iv);

  try {
    await Application.findOneAndUpdate(
      { _id: ObjectId(decryptedId) },
      { applicant_opinion: query.avis, applicant_feedback_date: new Date() }
    );

    return { result: "ok", message: "opinion registered" };
  } catch (err) {
    console.log("err ", err);
    Sentry.captureException(err);
    return { error: "error_saving_opinion" };
  }
};

const saveApplicationFeedbackComment = async ({ query }) => {
  await validateFeedbackApplicationComment({
    id: query.id,
    iv: query.iv,
    comment: query.comment,
  });

  let decryptedId = decryptWithIV(query.id, query.iv);

  try {
    await Application.findOneAndUpdate(
      { _id: ObjectId(decryptedId) },
      { applicant_feedback: query.comment, applicant_feedback_date: new Date() }
    );

    return { result: "ok", message: "comment registered" };
  } catch (err) {
    console.log("err ", err);
    Sentry.captureException(err);
    return { error: "error_saving_comment" };
  }
};

const saveApplicationIntentionComment = async ({ query, mailer }) => {
  // email and phone should appear
  await validateFeedbackApplicationComment({
    id: query.id,
    iv: query.iv,
    comment: query.comment,
  });

  let decryptedId = decryptWithIV(query.id, query.iv);

  try {
    const application = await Application.findOneAndUpdate(
      { _id: ObjectId(decryptedId) },
      { company_intention: query.intention, company_feedback: query.comment, company_feedback_date: new Date() }
    );

    sendNotificationToApplicant({
      mailer,
      application,
      intention: query.intention,
      email: query.email,
      phone: query.phone,
      comment: query.comment,
    });

    return { result: "ok", message: "comment registered" };
  } catch (err) {
    console.log("err ", err);
    Sentry.captureException(err);
    return { error: "error_saving_comment" };
  }
};

const findApplicationByTypeAndMessageId = async ({ messageId, type, email }) => {
  return await Application.findOne(
    type === "application"
      ? { company_email: email, to_company_message_id: messageId }
      : { applicant_email: email, to_applicant_message_id: messageId }
  );
};

const debugUpdateApplicationStatus = async ({ mailer, query, shouldCheckSecret }) => {
  if (shouldCheckSecret && !query.secret) {
    logger.error("Debugging sendinblue webhook : secret missing");
  } else if (shouldCheckSecret && query.secret !== config.secretUpdateRomesMetiers) {
    logger.error("Debugging sendinblue webhook : wrong secret");
  } else {
    updateApplicationStatus({ payload: { ...query, secret: "" }, mailer });
  }
};

const sendNotificationToApplicant = async ({ mailer, application, intention, email, phone, comment }) => {
  switch (intention) {
    case "entretien": {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse positive à votre candidature chez ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-entretien"),
        data: { ...application._doc, ...images, email, phone, comment },
      });
      break;
    }
    case "ne_sais_pas": {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse à votre candidature chez ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-nsp"),
        data: { ...application._doc, ...images, email, phone, comment },
      });
      break;
    }
    case "refus": {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse à votre candidature chez ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-refus"),
        data: { ...application._doc, ...images, comment },
      });
      break;
    }
    default:
      break;
  }
};

const notifyHardbounceToApplicant = async ({ mailer, application }) => {
  mailer.sendEmail({
    to: application.applicant_email,
    subject: `${application.company_name} n'a pas reçu votre candidature sur La Bonne Alternance`,
    template: getEmailTemplate("mail-candidat-hardbounce"),
    data: { ...application._doc, ...images },
  });
};

const warnMatchaTeamAboutBouncedEmail = async ({ application, mailer }) => {
  mailer.sendEmail({
    to: config.matchaEmail,
    subject: `Hardbounce détecté pour ${application.company_name}`,
    template: getEmailTemplate("mail-matcha-hardbounce"),
    data: { ...application._doc, ...images },
  });
};

const removeEmailFromBonnesBoites = async (email) => {
  try {
    oleoduc(
      BonnesBoites.find({ email }).cursor(),
      writeData((company) => {
        company.email = "";
        company.save();
      })
    );
  } catch (err) {
    logger.error(`Failed to clean bonnes boîtes emails from hardbounce (${email})`);
    // do nothing
  }
};

const updateApplicationStatus = async ({ payload, mailer }) => {
  /* Format payload
    { 
      event : "unique_opened",
      id: 497470,
      date: "2021-12-27 14:12:54",
      ts: 1640610774,
      message-id: "<48ea8e31-715e-d929-58af-ca0c457d2654@apprentissage.beta.gouv.fr>",
      email:"alan.leruyet@free.fr",
      ts_event: 1640610774,
      subject: "Votre candidature chez PARIS BAGUETTE FRANCE CHATELET EN ABREGE",
      sending_ip: "93.23.252.236",
      ts_epoch: 1640610774707
    }*/

  const event = payload.event;

  let messageType = "application";
  if (payload.subject.startsWith("Réponse")) {
    // les messages de notifications intention recruteur -> candidat sont ignorés
    return;
  } else if (payload.subject.startsWith("Votre candidature chez")) {
    messageType = "applicationAck";
  }

  let application = await findApplicationByTypeAndMessageId({
    type: messageType,
    messageId: payload["message-id"],
    email: payload.email,
  });

  if (!application) {
    logger.error(
      `Application webhook : application not found. message_id=${payload["message-id"]} email=${payload.email} subject=${payload.subject}`
    );
    return;
  }

  if (event === "hard_bounce" && messageType === "application") {
    addEmailToBlacklist(payload.email, application.company_type);

    if (application.company_type === "lbb" || application.company_type === "lba") {
      removeEmailFromBonnesBoites(payload.email);
    } else if (application.company_type === "matcha") {
      warnMatchaTeamAboutBouncedEmail({ email: payload.email, application, mailer });
    }

    notifyHardbounceToApplicant({ application, mailer });
  }

  // mise à jour du statut de l'email
  if (messageType === "application") {
    application.to_company_message_status = event;
  } else if (messageType === "applicationAck") {
    application.to_applicant_message_status = event;
  }

  application.save();
};

const addEmailToBlacklist = async (email, source) => {
  try {
    await new EmailBlacklist({
      email,
      source,
    }).save();
  } catch (err) {
    // catching unique address error
    logger.error(`Failed to save email to blacklist (${email}). Reason : ${err}`);
  }
};

const sendTestMail = async ({ mailer, query }) => {
  if (!query.secret) {
    return { error: "secret_missing" };
  } else if (query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" };
  } else {
    try {
      console.log("sending test mail to : ", query.email);

      const mailData = {
        user: {
          email: query.email,
        },
      };

      return mailer.sendEmail({
        to: query.applicant_email,
        subject: "Envoi mail de test",
        template: getEmailTemplate("mail-candidat"),
        data: mailData,
      });
    } catch (err) {
      Sentry.captureException(err);
      return { error: "error_sending_test_mail" };
    }
  }
};

const getEmailTemplate = (type = "mail-candidat") => {
  return path.join(currentDirname, `../assets/templates/${type}.mjml.ejs`);
};

const updateBlockedEmails = async ({ query, shouldCheckSecret }) => {
  if (shouldCheckSecret && (!query || !query.secret)) {
    logger.error("Debugging sendinblue webhook : secret missing");
  } else if (shouldCheckSecret && query.secret !== config.secretUpdateRomesMetiers) {
    logger.error("Debugging sendinblue webhook : wrong secret");
  } else {
    await updateSendinblueBlockedEmails({ query });
  }
};

export {
  getApplications,
  sendTestMail,
  sendApplication,
  saveApplicationFeedback,
  saveApplicationFeedbackComment,
  saveApplicationIntentionComment,
  updateApplicationStatus,
  debugUpdateApplicationStatus,
  updateBlockedEmails,
};
