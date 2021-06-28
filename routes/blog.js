const { Router } = require('express');
const { check } = require('express-validator');
const { 
    obtainLatestPost, 
    obtainPosts,
    obtainPost, 
    newPost, 
    newComment, 
    newResponseComment, 
    obtainListCommentAndResonsePost, 
    contactUs, 
    listPosts, 
    postToUpdate, 
    updatePost,
    deletePost
} = require('../controllers/blog');
const { validarCampos } = require('../middleware/valida-campos');

const router = Router();

router.get('/obtainLatestPost', obtainLatestPost);
router.get('/obtainPosts/:page', obtainPosts);
router.get('/obtainPost/:id', obtainPost);
router.get('/obtainComentAndResponsePost/:idPost', obtainListCommentAndResonsePost);

router.post(
    '/commentPost',
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').not().isEmpty(),
        check('comment', 'El comentario es obligatorio').not().isEmpty(),
        check('idPost', 'El id del post es obligatorio').not().isEmpty(),
        validarCampos
    ], newComment);

router.post(
    '/responseCommentPost',
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').not().isEmpty(),
        check('comment', 'El comentario es obligatorio').not().isEmpty(),
        check('idComment', 'El id del post es obligatorio').not().isEmpty(),
        validarCampos
    ], newResponseComment);

router.post(
    '/contactUs', 
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').not().isEmpty(),
        check('phone', 'El teléfono es obligatorio').not().isEmpty(),
        check('message', 'El id del post es obligatorio').not().isEmpty(),
        validarCampos
    ], contactUs);

//Rutas para la administracion CRM
router.get('/listPosts/:page/:limit', listPosts);

router.get('/postToUpdate/:id', postToUpdate);

router.put(
    '/update/:id', 
    [
        check('title', 'El titulo es obligatorio').not().isEmpty(),
        check('author', 'El autor es obligatorio').not().isEmpty(),
        check('description', 'La descripcion es obligatorio').not().isEmpty(),
        check('comment', 'El comentario es obligatorio').not().isEmpty(),
        validarCampos
    ],
    updatePost);

router.post(
    '/new', 
    [
        check('title', 'El titulo es obligatorio').not().isEmpty(),
        check('author', 'El autor es obligatorio').not().isEmpty(),
        check('description', 'La descripcion es obligatorio').not().isEmpty(),
        check('comment', 'El comentario es obligatorio').not().isEmpty(),
        validarCampos
    ],
    newPost);

router.delete('/delete/:id', deletePost);

module.exports = router;