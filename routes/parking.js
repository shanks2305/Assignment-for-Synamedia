const express = require('express');
const {
    registerParking,
    getUserParking,
    getAllParked,
    cancel,
    modify,
} = require('../controler/parking');

const router = express.Router();

// Reserve Parking Spot API
router.post('/reserve', registerParking);

// View Parking Reservation API
router.get('/reservation', getUserParking);

// View All Parked Vehicles API
router.get('/parked-vehicles', getAllParked);

// Cancel Parking Reservation API
router.delete('/cancel', cancel);

// Modify Parking Spot API
router.put('/modify', modify);

module.exports = router;
