import nodemailer from "nodemailer";

export async function sendMail(subject, htmlContent) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Smart Coin Labs" <${process.env.GMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject,
            html: `<div style="font-family: Arial, sans-serif; line-height:1.5;">
              <h2>${subject}</h2>
              <p>${htmlContent}</p>
             </div>`,
        });

        console.log("📩 Email sent successfully!");
    } catch (error) {
        console.error("❌ Email error:", error);
    }
}
