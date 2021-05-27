const { Router } = require('express');
const { obtainCampaigns, sendEmail } = require('../controllers/campaign');

const router = Router();

router.get('/listCampaign', obtainCampaigns);
router.post('/sendemail/:idCampaign', sendEmail);

module.exports = router;