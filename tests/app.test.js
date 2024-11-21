const request = require('supertest');
const app = require('../app'); // Import the app
const db = require('../database/db'); // Import the database connection

beforeAll((done) => {
    // Ensure database is clean before tests
    db.serialize(() => {
        db.run(`DELETE FROM reservations`);
        db.run(`UPDATE parking_spots SET status = 'available'`);
        done();
    });
});

describe('Parking Lot Management System', () => {
    let testReservation;

    test('Reserve a parking spot', async () => {
        const response = await request(app).post('/api/parking/reserve').send({
            name: 'John Doe',
            email: 'john@example.com',
            vehicle: 'AB123CD',
        });

        expect(response.status).toBe(201);
        expect(response.body.reservation).toHaveProperty('id');
        expect(response.body.reservation).toHaveProperty('spot');
        expect(response.body.reservation.spot).toBeGreaterThanOrEqual(1);

        testReservation = response.body.reservation;
    });

    test('View parking reservation by email', async () => {
        const response = await request(app)
            .get('/api/parking/reservation')
            .query({ email: 'john@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.reservation).toEqual(testReservation);
    });

    test('View parking reservation by vehicle license plate', async () => {
        const response = await request(app)
            .get('/api/parking/reservation')
            .query({ licensePlate: 'AB123CD' });

        expect(response.status).toBe(200);
        expect(response.body.reservation).toEqual(testReservation);
    });

    test('View all parked vehicles', async () => {
        const response = await request(app).get('/api/parking/parked-vehicles');

        expect(response.status).toBe(200);
        expect(response.body.vehicles.length).toBe(1);
        expect(response.body.vehicles[0]).toEqual(testReservation);
    });

    test('Modify parking spot', async () => {
        const response = await request(app).put('/api/parking/modify').send({
            email: 'john@example.com',
            newSpot: 5,
        });

        expect(response.status).toBe(200);
        expect(response.body.reservation.spot).toBe(5);
    });

    test('Cancel parking reservation', async () => {
        const response = await request(app).delete('/api/parking/cancel').send({
            email: 'john@example.com',
            spot: 5,
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Reservation canceled successfully.');
    });

    test('Fail to view a canceled reservation', async () => {
        const response = await request(app)
            .get('/api/parking/reservation')
            .query({ email: 'john@example.com' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Reservation not found.');
    });
});

afterAll((done) => {
    // Close the database connection after tests
    db.close();
    done();
});
