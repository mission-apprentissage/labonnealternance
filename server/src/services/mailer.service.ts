import { promisify } from "util"

import ejs, { Data } from "ejs"
import mjml from "mjml"
import nodemailer, { Transporter } from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import nodemailerHtmlToText from "nodemailer-html-to-text"

import config from "../config"

const htmlToText = nodemailerHtmlToText.htmlToText
const renderFile: (path: string, data: Data) => Promise<string> = promisify(ejs.renderFile)

const createTransporter = (): Transporter => {
  const needAuthentication = config.env === "production"

  const options: SMTPTransport.Options = {
    host: config.smtp.host,
    port: config.smtp.port,
  }

  if (needAuthentication) {
    options.auth = config.smtp.auth
  }

  const transporter = nodemailer.createTransport(options)

  transporter.use("compile", htmlToText({ ignoreImage: true }))

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
      from = config.transactionalEmail,
      cc = undefined,
      attachments,
    }: {
      to: string
      subject: string
      template: string
      data: object
      from?: string
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
