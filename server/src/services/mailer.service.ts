import { promisify } from "util"

import ejs, { Data } from "ejs"
import mjml from "mjml"
import nodemailer, { Transporter } from "nodemailer"
import { Address } from "nodemailer/lib/mailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import nodemailerHtmlToText from "nodemailer-html-to-text"

import { startSentryPerfRecording } from "@/common/utils/sentryUtils"

import config from "../config"

const htmlToText = nodemailerHtmlToText.htmlToText
const renderFile: (path: string, data: Data) => Promise<string> = promisify(ejs.renderFile)

export const sanitizeForEmail = (text: string | null | undefined, keepBr?: "keepBr") => {
  if (!text) return ""
  if (keepBr === "keepBr") {
    text = text.replaceAll(/<(?!br\s*\/?)[^>]+>/gi, "")
  } else {
    text = text.replaceAll(/(<([^>]+)>)/gi, "")
  }
  text = text.replaceAll(/\./g, "\u200B.\u200B")
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
    const onFinally = startSentryPerfRecording("mailer", "renderEmail")
    try {
      const buffer = await renderFile(template, { data })
      const { html } = mjml(buffer.toString(), { minify: true })

      return html
    } finally {
      onFinally()
    }
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
      const html = await renderEmail(template, data)
      const onFinally = startSentryPerfRecording("mailer", "sendEmail")

      return transporter
        .sendMail({
          from,
          to,
          cc,
          subject,
          html,
          list: {},
          attachments,
        })
        .finally(onFinally)
    },
  }
}

const mailer = createMailer()

export default mailer
