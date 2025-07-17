const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendWelcomeEmail = async (toEmail, userName) => {
  const websiteUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const templatePath = path.join(__dirname, "../views/welcomeEmail.ejs");

  try {
    const htmlContent = await ejs.renderFile(templatePath, {
      userName,
      logoUrl: `https://res.cloudinary.com/dutetsivc/image/upload/furniro/Meubel_House_Logos-05.png`,
      websiteUrl,
    });

    const mailOptions = {
      from: `"Furniro" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to Furniro!",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to", toEmail);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
  }
};

module.exports = { sendWelcomeEmail };
