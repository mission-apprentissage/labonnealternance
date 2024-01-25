import { promisify } from "util"

import ejs, { Data } from "ejs"
import mjml from "mjml"
import nodemailer, { Transporter } from "nodemailer"
import { Address } from "nodemailer/lib/mailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import nodemailerHtmlToText from "nodemailer-html-to-text"

import config from "../config"

const htmlToText = nodemailerHtmlToText.htmlToText
const renderFile: (path: string, data: Data) => Promise<string> = promisify(ejs.renderFile)

export const sanitizeForEmail = (text: string | null | undefined) => {
  if (!text) return ""
  text = text.replaceAll(/(<([^>]+)>)/gi, "")
  text = text.replaceAll(/\./g, "\u200B.\u200B")
  text = encodeURIComponent(text)
  return text
}

const createTransporter = (): Transporter => {
  const needAuthentication = config.env === "production" || config.env === "pentest"

  const options: SMTPTransport.Options = {
    host: config.smtp.host,
    port: config.smtp.port,
  }

  if (needAuthentication) {
    options.auth = config.smtp.auth
  }

  const transporter = nodemailer.createTransport(options)

  transporter.use("compile", htmlToText())

  return transporter
}

const createMailer = () => {
  const transporter = createTransporter()
  const renderEmail = async (template: string, data: Data = {}): Promise<string> => {
    const buffer = await renderFile(template, { data })
    const { html } = mjml(buffer.toString(), { minify: true })

    return html
  }

  return {
    /**
     * Process template ejs and mjml template.
     */
    renderEmail,
    sendEmail: async ({
      to,
      subject,
      template,
      data,
      from = { name: config.transactionalEmailSender, address: config.transactionalEmail },
      cc = undefined,
      attachments,
    }: {
      to: string
      subject: string
      template: string
      data: object
      from?: string | Address
      cc?: string
      attachments?: object[]
    }): Promise<{ messageId: string; accepted?: string[] }> => {
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
  }
}

const mailer = createMailer()

export default mailer
