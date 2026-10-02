import { OPCOS_LABEL } from "shared/constants/index"
import { AUTHTYPE } from "shared/constants/recruteur"
import { toFrenchNationalPhone } from "shared/validators/phone-validator"
import { z } from "zod"

import { EMAIL_FORMAT_ERROR, PHONE_FORMAT_ERROR } from "@/utils/validation-messages"

const { OPCO, ADMIN } = AUTHTYPE

// Messages en français propres au formulaire : ZNewSuperUser / ZUserWithAccountFields servent aussi l'API
export const buildAdminUserFormSchema = (isCreation: boolean) =>
  z
    .object({
      first_name: z.string({ error: "Saisissez le prénom" }).trim().min(1, "Saisissez le prénom"),
      last_name: z.string({ error: "Saisissez le nom" }).trim().min(1, "Saisissez le nom"),
      email: z.email({ error: EMAIL_FORMAT_ERROR }),
      phone: z
        .string()
        .refine((phone) => toFrenchNationalPhone(phone) !== null, PHONE_FORMAT_ERROR)
        .optional(),
      type: z.enum([OPCO, ADMIN]),
      opco: z.enum(OPCOS_LABEL, { error: "Sélectionnez un OPCO" }).nullish(),
    })
    .refine((values) => values.type !== OPCO || Boolean(values.opco), {
      path: ["opco"],
      message: "Sélectionnez un OPCO",
      // sans `when`, Zod saute la règle dès qu'un champ est absent (Formik convertit "" en undefined) : l'erreur OPCO n'apparaîtrait qu'au second envoi
      when: () => isCreation,
    })
