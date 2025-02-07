const express = require('express');
const router = express.Router();
const { addVenue, editVenue, deleteVenue, getAllVenues } = require('../controllers/venueController');
const upload = require('../multerConfig');

router.post('/venues', upload.single('image'), addVenue);
router.put('/venues/:id', upload.single('image'), editVenue);
router.delete('/venues/:id', deleteVenue);
router.get('/venues', getAllVenues);

module.exports = router;