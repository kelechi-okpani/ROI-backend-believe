import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // 1. Create Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false 
    }
  });


  try {
    await transporter.verify();
  } catch (err) {
    console.error("Transporter Configuration Error:", err);
    throw new Error("SMTP connection failed");
  }
  

  // 2. Define Options
  const mailOptions = {
    from: `"Investment Platform" <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // 3. Send and Log
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Email dispatch error:", error);
    throw new Error("Email could not be sent");
  }
};