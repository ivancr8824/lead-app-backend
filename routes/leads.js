const { Router } = require('express');
const { check } = require('express-validator');
const { saveLead, listLeads, updateLead, deleteLead, searchLeads, allLeads } = require('../controllers/leads');
const { validarCampos } = require('../middleware/valida-campos');

const router = Router();

router.get('/:page/:limit', listLeads);

router.get('/search/:page/:limit', searchLeads);

router.get('/all', allLeads);

router.post(
    '/new', 
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('phone', 'El Telefono es obligatorio').not().isEmpty(),
        validarCampos
    ] ,
    saveLead
);

router.put(
    '/:id', 
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('phone', 'El Telefono es obligatorio').not().isEmpty(),
        check('statusLeads', 'El Telefono es obligatorio').not().isEmpty(),
        validarCampos
    ],
    updateLead
)

router.delete('/:id', deleteLead);

module.exports = router;