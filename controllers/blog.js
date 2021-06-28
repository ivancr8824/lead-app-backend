const { response } = require('express');
const moment = require('moment');
require('moment/locale/es');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const capitalize = require('../helpers/capitalize-text');
const { credentialsGoogle } = require('../database/google-sheet');

moment.locale('es');

const obtainLatestPost = (req, res = response) => {
    const data = fs.readFileSync('json/blogPost.json');
    const result = JSON.parse(data);
    
    if(result.posts.length > 6){
        const lastSix = result.posts.slice(-6);
        return res.status(200).json({
            ok: true,
            result: lastSix
        });
    }
    
    return res.status(200).json({
        ok: true,
        result: result.posts
    });
}

const obtainPosts = (req, res = response) => {

    const page = req.params.page;

    const data = fs.readFileSync('json/blogPost.json');
    const result = JSON.parse(data);

    const startIndex = (page - 1) * 9;
    const endIndex = page * 9;

    //Obtengo los resultados paginados
    let results = result.posts.map(x => ({
        id: x.id,
        date: x.date,
        title: x.title,
        author: x.author,
        description: x.description,
        comment: x.comment,
        urlImage: x.urlImage
    }))
    .slice(startIndex, endIndex);

    let totalPages = (results.length == 0) ? page - 1 : Math.ceil(result.posts.length / 9);

    return res.status(200).json({
        ok: true,
        totalPages: (totalPages === 0) ? 1 : totalPages,
        totalRegistros: result.posts.length,
        result: results
    });
}

const obtainPost = async(req, res = response) => {
    const id = req.params.id;

    const data = fs.readFileSync('json/blogPost.json');
    const result = JSON.parse(data);

    return res.json({
        ok: true,
        result: result.posts[id - 1] || null
    })
}

const obtainListCommentAndResonsePost = async(req, res = response) => {
    try {
        const idPost = req.params.idPost;

        const document = await credentialsGoogle();

        const sheetComment = document.sheetsByIndex[2];
        const sheetResponseComment = document.sheetsByIndex[3];

        const rowsComment = await sheetComment.getRows();
        const rowsResponseComment = await sheetResponseComment.getRows();

        const results = rowsComment.filter(rc => rc.Id_Post === idPost)
        .map(rc => ({
               id: rc.Id,
               name: rc.Name,
               email: rc.Email,
               comment: rc.Comment,
               date: rc.Date,
               responsePost: rowsResponseComment.filter(rrc => rrc.Id_Comment === rc.Id)
               .map(rrc => ({
                   id: rrc.Id,
                   name: rrc.Name,
                   email: rrc.Email,
                   comment: rrc.Comment,
                   date: rrc.Date
               }))
        }));

        res.json({
            ok: true,
            results
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const newComment = async (req, res = response) => {
    try {

        const { name, email, comment, idPost } = req.body;

        const document = await credentialsGoogle();

        const sheet = document.sheetsByIndex[2];
        const rows = await sheet.getRows();

        const idComment = (rows.length > 0 ) ? parseInt(rows[rows.length - 1].Id) + 1 : 1;

        const newComment = { 
            Id: idComment, 
            Name: name, 
            Email: email.toLowerCase(),
            Comment: comment,
            Date: capitalize(moment().format('MMMM DD, YYYY [a las] h:mm')),
            Id_Post: idPost
        }

        //guardo el nuevo comentario
        sheet.addRow(newComment);

        res.json({
            ok: true,
            msg: 'Tu comentario fue agregado correctamente',
            results: {
                id: idComment,
                name,
                email: email.toLowerCase(),
                date: newComment.Date,
                comment,
                responsePost: []
            }
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const newResponseComment = async (req, res = response) => {
    try {
        const { name, email, comment, idComment } = req.body;

        const document = await credentialsGoogle();

        const sheet = document.sheetsByIndex[3];
        const rows = await sheet.getRows();

        const idResponseComment = (rows.length > 0 ) ? parseInt(rows[rows.length - 1].Id) + 1 : 1;

        const newResponseComment = { 
            Id: idResponseComment, 
            Name: name, 
            Email: email.toLowerCase(),
            Comment: comment,
            Date: capitalize(moment().format('MMMM DD, YYYY [a las] h:mm')),
            Id_Comment: idComment
        }

        //guardo el nuevo comentario
        sheet.addRow(newResponseComment);

        res.json({
            ok: true,
            msg: 'Tu comentario fue agregado correctamente',
            results: {
                id: idResponseComment,
                name,
                email: email.toLowerCase(),
                comment,
                date: newResponseComment.Date,
            }
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const contactUs = async (req, res = response) => {
    try {

        const { name, email, phone, countrie, message } = req.body;
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
            Countrie: countrie,
            StatusLeads: 'Abierto', 
            StatusRegister: 'Activo'
        }
        
        //guardo nuevo registro
        sheet.addRow(newRegister);

        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
    
        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        });
    
        const accessToken = await oauth2Client.getAccessToken();
    
        const mail = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_CONSALUD,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false
            }
        });
        
        const mailOptions = {
            from: process.env.EMAIL_CONSALUD,
            to: process.env.EMAIL_CONSALUD,
            subject: `${name} se ha contactado desde el blog`,
            html: message
        };
        
        mail.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error)
            }
        });

        return res.json({
            ok: true,
            msg: '¡Muchas gracias!. Por contactares, muy pronto un asesor se comunicará con ud. para resolver sus dudas',
            results: ''
        });
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

//Metodos para la admnistracion en CRM
const listPosts = (req, res = response) => {
    const page = req.params.page;
    const limit = req.params.limit;
    try {
        const data = fs.readFileSync('json/blogPost.json');
        const result = JSON.parse(data);

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        //Obtengo los resultados paginados
        let results = result.posts.map(x => ({
            id: x.id,
            date: x.date,
            title: x.title,
            author: x.author,
            description: x.description,
            comment: x.comment,
            urlImage: x.urlImage
        }))
        .slice(startIndex, endIndex);

        let totalPages = (results.length == 0) ? page - 1 : Math.ceil(result.posts.length / limit);


        res.json({
            ok: true,
            totalPages: (totalPages === 0) ? 1 : totalPages,
            totalRegisters: result.posts.length,
            results
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const postToUpdate = (req, res = response) => {
    const id = req.params.id;
    try{
        const data = fs.readFileSync('json/blogPost.json');
        const result = JSON.parse(data);

        let results = result.posts.map(p => ({
            id: p.id,
            date: p.date,
            title: p.title,
            author: p.author,
            description: p.description,
            comment: p.comment,
            urlImage: p.urlImage
        })).filter(x => x.id === parseInt(id))[0];

        res.json({
            ok: true,
            results
        });

    } catch(error){
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    } 

}

const updatePost = (req, res = response) => {

    const id = req.params.id;
    const { title, author, description, comment, urlImage } = req.body;

    try {
        const data = fs.readFileSync('json/blogPost.json');
        const result = JSON.parse(data);

        result.posts.forEach(p => {
            if(p.id === parseInt(id)){
                p.title = title;
                p.author = author;
                p.description = description;
                p.comment = comment;
                p.urlImage = urlImage;
            }
        });

        fs.writeFile('json/blogPost.json', JSON.stringify(result), 'utf-8', function(err) {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    msg: err
                }); 
            }
        })

        res.json({
            ok: true,
            msg: 'El post fue actualizado correctamente'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}

const newPost = (req, res = response) => {
    try{
        const { title, author, description, comment, urlImage } = req.body;

        fs.readFile('json/blogPost.json', 'utf-8', function(err, data) {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    msg: err
                }); 
            }
        
            var result = JSON.parse(data)
            
            const id = (result.posts.length > 0) ? parseInt(result.posts[result.posts.length - 1].id) + 1 : 1;
        
            result.posts.push({
                id,
                date: capitalize(moment().format('MMMM DD, YYYY')),
                title,
                author,
                description,
                comment,
                urlImage
            });
        
            fs.writeFile('json/blogPost.json', JSON.stringify(result), 'utf-8', function(err) {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        msg: err
                    }); 
                }
            })
        })
        
        res.json({
            ok: true,
            msg: 'El post fue creado correctamente'
        });
    }
    catch{
        console.log(error)
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }
}


const deletePost = (req, res = response) => {
    const id = req.params.id;
    try{
        const data = fs.readFileSync('json/blogPost.json');
        const result = JSON.parse(data);

        const postDelete = result.posts.filter(x => x.id === parseInt(id))[0];
        const index = result.posts.indexOf(postDelete);

        result.posts.splice(index, 1);

        fs.writeFile('json/blogPost.json', JSON.stringify(result), 'utf-8', function(err) {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    msg: err
                }); 
            }
        });

        res.json({
            ok: true,
            msg: 'El post fue eliminado correctamente'
        });

    } catch(error){
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el Administrador'
        });
    }     
}


module.exports = {
    obtainLatestPost,
    obtainPosts,
    obtainPost,
    newPost,
    listPosts,
    postToUpdate,
    updatePost,
    deletePost,
    obtainListCommentAndResonsePost,
    newComment,
    newResponseComment,
    contactUs
}