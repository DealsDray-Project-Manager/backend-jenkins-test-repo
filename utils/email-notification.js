const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.dealsdray.com",
  port: 587,
  secure: false,
  auth: {
    user: "prexo-no-reply@dealsdray.com",
    pass: "Set**33@1",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  blancoDataUpdateNotification: (values, trayDetails) => {
    try {
      let tableRows = "";
      for (const value of values) {
        tableRows += `
          <tr>
            <td style="border: 1px solid black;">${value.updatedUic}</td>
            <td style="border: 1px solid black;">${value.tray}</td>
            <td style="border: 1px solid black;">${value.brand}</td>
            <td style="border: 1px solid black;">${value.model}</td>
          </tr>
        `;
      }

      const htmlContent = `
        <html>
        <body>
          <p>Dear Admin,</p>
          <p >The following items have been updated post a Blancoo import into the Prexo System.</p>
          <p>
          Date & Time of import: ${new Date(Date.now()).toLocaleString(
            "en-GB",
            {
              hour12: true,
            }
          )}
          <br>
          Data Imported: ${values?.length} SKUs
          <br>
          Trays Updated: ${trayDetails?.length} Trays
          </p>
          <p>UIC Details</p>
          <table style="border-collapse: collapse; width: 100%; height: auto">
            <tr>
              <th style="border: 1px solid black;">UIC</th>
              <th style="border: 1px solid black;">Tray</th>
              <th style="border: 1px solid black;">Brand</th>
              <th style="border: 1px solid black;">Model</th>
            </tr>
            ${tableRows}
          </table>
          <p>Thanks and regards</p>
          <p>PREXO IMPORT MODULE</p>
        </body>
        </html>
      `.trim();

      const mailOptions = {
        from: "prexo-no-reply@dealsdray.com",
        to: "girish.kumar@dealsdray.com",
        subject: `[${new Date(Date.now()).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}] Blancoo task scheduler report`,
        html: htmlContent,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error occurred:", error.message);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};
