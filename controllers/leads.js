const { response } = require('express');
const { credentialsGoogle } = require('../database/google-sheet');

const saveLead = async (req, res = response) => {
    try {

        const { name, email, phone } = req.body;
        let id = 0;

        const document = await credentialsGoogle();

        const sheet = document.sheetsByIndex[0];
        const rows = await sheet.getRows();

        id = (rows.length > 0 ) ? parseInt(rows[rows.length - 1].Id) + 1 : 1;
        
        const newRegister = { 
            Id: id, 
            Name: name, 
            Phone: phone, 
            Email: email, 
            StatusLeads: 'Abierto', 
            StatusRegister: 'Activo'
        }
        
        //guardo nuevo registro
        sheet.addRow(newRegister);

        res.json({
            ok: true,
            msg: 'Lead creado correctamente'
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const listLeads = async (req, res = response) => {
    try {

        const page = req.params.page;
        const limit = req.params.limit;

        const document = await credentialsGoogle();

        const sheet = document.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        //Obtengo los resultados paginados
        let results = rows.map(x => ({
            Id: x.Id,
            Name: x.Name,
            Phone: x.Phone,
            Email: x.Email,
            StatusLead: x.StatusLeads,
            StatusRegister: x.StatusRegister
        }))
        .filter(r => r.StatusRegister === 'Activo')
        .slice(startIndex, endIndex);

        res.json({
            ok: true,
            totalPages: Math.ceil(rows.length / limit),
            totalRegistros: rows.length,
            leads: results
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const updateLead = async (req, res = response) => {
    try {
        const id = req.params.id;
        const { name, email, phone, statusLeads } = req.body;

        const document = await credentialsGoogle();

        const sheet = document.sheetsByIndex[0];
        const rows = await sheet.getRows();

        //Actualizo los registros de la fila en el excel
        rows[id - 1].Name = name
        rows[id - 1].Phone = phone
        rows[id - 1].Email = email
        rows[id - 1].StatusLeads = statusLeads

        await rows[id - 1].save();

        res.json({
            ok: true,
            msg: 'Actualizacion exitosa'
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const deleteLead = async(req, res = response) => {
    try {
        const id = req.params.id;

        const document = await credentialsGoogle();

        const sheet = document.sheetsByIndex[0];
        const rows = await sheet.getRows();

        //Elimino el registro
        rows[id - 1].StatusRegister = 'Eliminado'

        await rows[id - 1].save();

        res.json({
            ok: true,
            msg: 'Registro eliminado correctamente'
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

module.exports = {
    saveLead,
    listLeads,
    updateLead,
    deleteLead
}