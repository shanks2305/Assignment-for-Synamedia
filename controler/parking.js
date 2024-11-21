const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');

// Promisify database functions
const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);
const dbAll = promisify(db.all).bind(db);

// Helper to handle async errors
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const registerParking = asyncHandler(async (req, res) => {
  const { name, email, vehicle } = req.body;

  // Check for available spot
  const availableSpot = await dbGet(
    `SELECT spot FROM parking_spots WHERE status = 'available' LIMIT 1`
  );

  if (!availableSpot) {
    return res.status(400).json({ message: 'No available parking spots.' });
  }

  const spot = availableSpot.spot;
  const id = uuidv4();

  // Reserve spot and update its status
  await dbRun(
    `INSERT INTO reservations (id, name, email, vehicle, spot) VALUES (?, ?, ?, ?, ?)`,
    [id, name, email, vehicle, spot]
  );
  await dbRun(`UPDATE parking_spots SET status = 'occupied' WHERE spot = ?`, [
    spot,
  ]);

  res.status(201).json({
    message: 'Reservation confirmed!',
    reservation: { id, name, email, vehicle, spot },
  });
});

const getUserParking = asyncHandler(async (req, res) => {
  const { email, licensePlate } = req.query;

  const reservation = await dbGet(
    `SELECT * FROM reservations WHERE email = ? OR vehicle = ?`,
    [email, licensePlate]
  );

  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found.' });
  }

  res.status(200).json({ reservation });
});

const getAllParked = asyncHandler(async (req, res) => {
  const vehicles = await dbAll(`SELECT * FROM reservations`);
  res.status(200).json({ vehicles });
});

const cancel = asyncHandler(async (req, res) => {
  const { email, spot } = req.body;

  const reservation = await dbGet(
    `SELECT * FROM reservations WHERE email = ? AND spot = ?`,
    [email, spot]
  );

  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found.' });
  }

  await dbRun(`DELETE FROM reservations WHERE email = ? AND spot = ?`, [
    email,
    spot,
  ]);
  await dbRun(`UPDATE parking_spots SET status = 'available' WHERE spot = ?`, [
    spot,
  ]);

  res.status(200).json({ message: 'Reservation canceled successfully.' });
});

const modify = asyncHandler(async (req, res) => {
  const { email, vehicle, newSpot } = req.body;

  const reservation = await dbGet(
    `SELECT * FROM reservations WHERE email = ? OR vehicle = ?`,
    [email, vehicle]
  );

  if (!reservation) {
    return res.status(404).json({ message: 'Reservation not found.' });
  }

  const spotStatus = await dbGet(
    `SELECT status FROM parking_spots WHERE spot = ?`,
    newSpot
  );

  if (!spotStatus || spotStatus.status !== 'available') {
    return res.status(400).json({ message: 'New spot is not available.' });
  }

  await dbRun(`UPDATE reservations SET spot = ? WHERE id = ?`, [
    newSpot,
    reservation.id,
  ]);
  await dbRun(`UPDATE parking_spots SET status = 'available' WHERE spot = ?`, [
    reservation.spot,
  ]);
  await dbRun(`UPDATE parking_spots SET status = 'occupied' WHERE spot = ?`, [
    newSpot,
  ]);

  res.status(200).json({
    message: 'Parking spot updated successfully.',
    reservation: { ...reservation, spot: newSpot },
  });
});

module.exports = {
  registerParking,
  getUserParking,
  getAllParked,
  cancel,
  modify,
};
