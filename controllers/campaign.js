const { response } = require('express');
const axios = require('axios');
const { credentialsGoogle } = require('../database/google-sheet');
//const nodemailer = require('nodemailer');
const { google } = require("googleapis");
//const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const blockArray = require('../helpers/segment-array');

const obtainCampaigns = async (req, res = response) => {
    
    const document = await credentialsGoogle();
    const sheet = document.sheetsByIndex[1];
    const rows = await sheet.getRows();
    
    let results = rows.map(x => ({
        Id: x.Id,
        Name: x.Name,
        Html: x.Html,
    }))

    res.json({
        ok: true,
        result: results
    });
}

const sendEmail = async(req, res = response) => {

    const id = req.params.idCampaign;
    const { emails } = req.body;

    const document = await credentialsGoogle();

    const sheet = document.sheetsByIndex[1];
    const rows = await sheet.getRows();
 
    const html = fs.readFileSync(`${rows[id - 1].Html}`, 'utf8');

    //Segmento el arreglo de 100 en 100
    const blockEmails = blockArray(emails, 100);

    for (let index = 0; index < blockEmails.length; index++) {
        
        const dataEmails = {
          from: {email: process.env.EMAIL_MAILRELAY, name: 'Consalud'},
          to: blockEmails[index],
          subject: rows[id - 1].Subject,
          html_part: html
        }

        await axios.post(`${process.env.URL_API_MAILRELAY}/send_emails`, 
            dataEmails, 
            {
                headers: {
                     "content-type": "application/json",
                     "x-auth-token": process.env.API_KEY_MAILRELAY
                }
            }
        );
    }

    return res.json({
      ok: true,
      msg: 'El correo fue enviado de forma satisfactoria'
    });
}

// const sendEmail = async(req, res = response) => {
//     const id = req.params.idCampaign;
//     const { emails } = req.body;

//     const document = await credentialsGoogle();

//     const sheet = document.sheetsByIndex[1];
//     const rows = await sheet.getRows();

//     const oauth2Client = new OAuth2(
//         process.env.CLIENT_ID,
//         process.env.CLIENT_SECRET,
//         "https://developers.google.com/oauthplayground"
//     );

//     oauth2Client.setCredentials({
//         refresh_token: process.env.REFRESH_TOKEN
//     });

//     const accessToken = await oauth2Client.getAccessToken();

//     const mail = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             type: "OAuth2",
//             user: process.env.EMAIL_CONSALUD,
//             clientId: process.env.CLIENT_ID,
//             clientSecret: process.env.CLIENT_SECRET,
//             refreshToken: process.env.REFRESH_TOKEN,
//             accessToken
//         },
//         tls: {
//             // do not fail on invalid certs
//             rejectUnauthorized: false
//         }
//     });

//     const html = fs.readFileSync(`${rows[id - 1].Html}`, 'utf8');

//     const mailOptions = {
//         from: process.env.EMAIL_CONSALUD,
//         to: emails,
//         subject: rows[id - 1].Subject,
//         html
//     };
    
//     mail.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             return res.json({
//                 ok: false,
//                 msg: 'Error al enviar el email'
//             });
//         }

//         return res.json({
//             ok: true,
//             msg: 'El correo fue enviado de forma satisfactoria'
//         });
//     });
// }

module.exports = {
    obtainCampaigns,
    sendEmail
}