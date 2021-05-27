const { response } = require('express');
const { credentialsGoogle } = require('../database/google-sheet');
const nodemailer = require('nodemailer');
const fs = require('fs');

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

    const mail = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_CONSALUD,
            pass: process.env.PASS_EMAIL
        }
    });

    const html = fs.readFileSync(`${rows[id - 1].Html}`, 'utf8');

    const mailOptions = {
        from: process.env.EMAIL_CONSALUD,
        to: emails,
        subject: rows[id - 1].Subject,
        html
    };
    
    mail.sendMail(mailOptions, (error, info) => {
        if (error) {

            console.log("ERROR PERSONALIZADO", error);

            return res.json({
                ok: false,
                msg: 'Error al enviar el email'
            });
        }

        return res.json({
            ok: true,
            msg: 'El correo fue enviado de forma satisfactoria'
        });
    });
}

module.exports = {
    obtainCampaigns,
    sendEmail
}