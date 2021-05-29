import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

interface EmailOptions {
  sendTo: string
  html: string
  subject?: string
}

export const sendEmail = async ({
  sendTo,
  html,
  subject = 'Password recovery.',
}: EmailOptions) => {
  try {
    const transport = nodemailer.createTransport({
      service: 'mail.ru',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_,
      },
    })

    await transport.sendMail({
      from: `"Reply service" <${process.env.EMAIL_USERNAME}>`, // sender address
      to: sendTo, // list of receivers
      subject, // Subject line
      html, // html body
    })
    console.log('email is sent to', sendTo)
  } catch (e) {
    console.log('email sending error\n', e.message)
  }
}
