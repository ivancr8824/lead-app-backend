const { GoogleSpreadsheet } = require('google-spreadsheet');
const credentials = require('../json/credenciales.json');

const credentialsGoogle = async () => {
    
    const document = new GoogleSpreadsheet(process.env.GOOGLE_ID);
    await document.useServiceAccountAuth(credentials);
    await document.loadInfo();

    return document;
}

module.exports = {
    credentialsGoogle
}