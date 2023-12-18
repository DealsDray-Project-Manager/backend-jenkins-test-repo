const nodemailer = require("nodemailer");
let subject = "";
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
      subject = "Blancoo task scheduler report";
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
        to: "muhammedrafnasvk@gmail.com",
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
  deleiveryReportOfLastWeek: (values) => {
    try {
      let tableRows = "";
      subject = "Last week Delivered and Opened Packets Purchase Data";
      for (const value of values) {
        tableRows += `
          <tr>
          <td style="border: 1px solid black;">${value.order_id}</td>
          <td style="border: 1px solid black;">${value.tracking_id}</td>
          <td style="border: 1px solid black;">${value.old_item_details
            ?.replace(/:/g, " ")
            ?.toUpperCase()}</td>
        
       
        <td style="border: 1px solid black;">${value.imei}</td>
        <td style="border: 1px solid black;">${value.item_id}</td>
        <td style="border: 1px solid black;">${
          value?.bot_report?.body_damage_des
        }</td>
        <td style="border: 1px solid black;">${
          value.tray_type == "MMT"
            ? "Model MisMatch MMT"
            : value.tray_type == "PMT"
            ? "Product MisMatch MMT"
            : "Model Verified BOT"
        }</td>
        <td style="border: 1px solid black;">${value.uic_code.code}</td>
        <td style="border: 1px solid black;">${
          value.partner_purchase_price ? value.partner_purchase_price : ""
        }</td>
        <td style="border: 1px solid black;">${
          value.order_date
            ? new Date(value.order_date).toLocaleString("en-GB", {
                hour12: true,
              })
            : ""
        }</td>
        <td style="border: 1px solid black;">${value.partner_shop}</td>
        <td style="border: 1px solid black;">${new Date(
          value.delivery_date
        ).toLocaleString("en-GB", {
          hour12: true,
        })}</td>
        <td style="border: 1px solid black;">${
          value.assign_to_agent
            ? new Date(value.assign_to_agent).toLocaleString("en-GB", {
                hour12: true,
              })
            : ""
        }</td>
        <td style="border: 1px solid black;">${
          value?.bot_report?.model_brand ? value?.bot_report?.model_brand : ""
        }</td>
        </tr>


        `;
      }

      const htmlContent = `
        <html>
        <body>
          <p>Dear Admin,</p>
          <p >The following items have been delivered and import into the Prexo System.</p>
          <p>
          Date & Time : ${new Date(Date.now()).toLocaleString("en-GB", {
            hour12: true,
          })}
          <br>
          <p>Unit Details</p>
          <table style="border-collapse: collapse; width: 100%; height: auto">
            <tr>
              <th style="border: 1px solid black;">Order Id</th>
              <th style="border: 1px solid black;">Tracking Id</th>
              <th style="border: 1px solid black;">Model Name</th>
              <th style="border: 1px solid black;">IMEI</th>
              <th style="border: 1px solid black;">SKU Name</th>
              <th style="border: 1px solid black;">Received Unit Remark (BOT)</th>
              <th style="border: 1px solid black;">Type</th>
              <th style="border: 1px solid black;">UIC</th>
              <th style="border: 1px solid black;">Price</th>
              <th style="border: 1px solid black;">Order Date</th>
              <th style="border: 1px solid black;">Location</th>
              <th style="border: 1px solid black;">Delivery Date</th>
              <th style="border: 1px solid black;">Packet Opening Date</th>
              <th style="border: 1px solid black;">Received Unit</th>
            </tr>
            ${tableRows}
          </table>
          <p>Thanks and regards</p>
          <p>PREXO Delivery Import MODULE</p>
        </body>
        </html>
      `.trim();

      const mailOptions = {
        from: "prexo-no-reply@dealsdray.com",
        to: "megha@dealsdray.com",
        subject: `[${new Date(Date.now()).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}]  ${subject}`,
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
  xmlUpdationMail: (gtDate, toDate) => {
    try {
      // Subject for the email
      const subject = "Confirmation: Blancoo XML Date Changes";

      // Composing HTML content for the email
      const htmlContent = `
  <html>
    <body>
      <p>Dear Admin,</p>
      <p>This is to confirm that the following items have been updated in Blancoo XML file :</p>
      <p>
        Date & Time XML Change: ${new Date(Date.now()).toLocaleString("en-GB", {
          hour12: true,
        })}
      </p>
      <p>Details:</p>
      <br>
      <p>Date of GT (Greater Than): ${new Date(gtDate).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}</p>
      <p>Date of LT (Less Than): ${new Date(toDate).toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })}</p>
      </p>
      <p>Thank you for your attention.</p>
      <p>Best regards,</p>
      <p>PREXO IMPORT MODULE</p>
    </body>
  </html>
`.trim();

      // Configuring mail options
      const mailOptions = {
        from: "prexo-no-reply@dealsdray.com",
        to: "muhammedrafnasvk@gmail.com",
        subject: `[${new Date(Date.now()).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}] Confirmation: Blancoo XML Date Changes`,
        html: htmlContent,
      };

      // Sending the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error occurred while sending email:", error.message);
        } else {
          console.log("Email sent successfully. Response:", info.response);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
  blancoUpdationFailedMail: () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const htmlContent = `
        <html>
        <body>
          <p>Dear Admin,</p>
          <p >kindly check  the blancoo API as the data for the date ${yesterday.toLocaleDateString(
            "en-GB",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          )} was not uploaded in the system.</p>
         
          <p>Thanks and regards</p>
          <p>PREXO IMPORT MODULE</p>
        </body>
        </html>
      `.trim();
      const mailOptions = {
        from: "prexo-no-reply@dealsdray.com",
        to: "muhammedrafnasvk@gmail.com",
        subject: ` Critical - Blancoo not updated [${new Date().toLocaleString(
          "en-GB",
          {
            month: "long",
            day: "numeric",
          }
        )} ${new Date().getFullYear()}]`,
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
