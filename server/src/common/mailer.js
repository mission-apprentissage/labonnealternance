import ejs from "ejs"
import { omit } from "lodash-es"
import mjml from "mjml"
import nodemailer from "nodemailer"
import nodemailerHtmlToText from "nodemailer-html-to-text"
import { promisify } from "util"
import config from "../config.js"

const htmlToText = nodemailerHtmlToText.htmlToText
const renderFile = promisify(ejs.renderFile)

/**
 * @description Create transporter.
 * @param {Object} smtp
 * @param {String} smtp.host
 * @param {String} smtp.port
 * @param {Object} smtp.auth
 * @param {String} smtp.user
 * @param {String} smtp.pass
 * @returns {Mail}
 */
const createTransporter = (smtp) => {
  const needAuthentication = config.env === "production" ? true : false

  const transporter = nodemailer.createTransport(needAuthentication ? smtp : omit(smtp, ["auth"]))

  transporter.use("compile", htmlToText({ ignoreImage: true }))

  return transporter
}

export default function (config, transporter = createTransporter(config.smtp)) {
  const renderEmail = async (template, data = {}) => {
    const buffer = await renderFile(template, { data })
    const { html } = mjml(buffer.toString(), { minify: true })

    return html
  }

  return {
    /**
     * @description Process template ejs and mjml template.
     * @returns {string}
     */
    renderEmail,
    /**
     * @description Sends email.
     * @param {string} to
     * @param {string} subject
     * @param {string} template
     * @param {Object} data
     * @param {string} from
     * @param {undefined|string} cc
     * @returns {Promise<{messageId: string}>}
     */
    sendEmail: async ({ to, subject, template, data, from = "nepasrepondre@apprentissage.beta.gouv.fr", cc = undefined, attachments }) => {
      return transporter.sendMail({
        from,
        to,
        cc,
        subject,
        html: await renderEmail(template, data),
        list: {},
        attachments,
      })
    },
    /**
     * @description Send plain test email.
     * @param {string} to
     * @param {string} subject
     * @returns {Promise<*>}
     */
    sendPlainTextEmail: async (to, subject) => {
      return transporter.sendMail({
        from: "nepasrepondre@apprentissage.beta.gouv.fr",
        to,
        subject,
        body: `Mail pour ${to}`,
        list: {},
      })
    },
  }
}
