const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { User, BusLine, BusStop } = require('../database');
const config = require("../config");
const { describe } = require('node:test');

let adminToken;

let lineData = {
      "directions": [
        {
          "name": "Departure",
          "stops": [
            {
              "name": "Stop A",
              "location": {
                "type": "Point",
                "coordinates": [12.5001, 41.9001]
              }
            },
            {
              "name": "Stop B",
              "location": {
                "type": "Point",
                "coordinates": [12.5010, 41.9010]
              }
            }
          ],
          "routeLegs": [
            {
              "duration": 10,
              "steps": [
                {
                  "duration": 10,
                  "geometry": {
                    "type": "LineString",
                    "coordinates": [
                      [12.5001, 41.9001],
                      [12.5010, 41.9010]
                    ]
                  }
                }
              ]
            }
          ],
          "timetable": [
            [
              { "hour": 8, "minute": 0 },
            ]
          ]
        }
      ]
    }


beforeAll(async () => {
  await mongoose.connect(config.MONGODB_URL)

  let admin = await User.findOne({ email: 'admin@example.com' });
  if (!admin) {
    admin = await User.create({
      name: { first: 'Admin', last: 'Test' },
      email: 'admin@example.com',
      password: 'password', 
      role: 'admin',
    });
  }

  const res = await request(app)
    .post('/auth/session')
    .send({ email: 'admin@example.com', password: 'password' });
  adminToken = `Bearer ${res.body.jwt}`;

});

afterAll(async () => {
  await BusLine.deleteMany({ name: /Test/i });
  await BusLine.deleteMany({ name: /Testing/i });
  await User.deleteMany({ email: 'admin@example.com' });
  await BusStop.deleteMany({ name: /Stop A|Stop B/i });

  await mongoose.connection.close();
});

describe('POST /lines', () => {
  it('create a new line', async () => {
    lineData.name = 'Test'
    const res = await request(app)
      .post('/lines')
      .set('Authorization', adminToken)
      .send(lineData);

    expect(res.statusCode).toBe(201);
  });

  it('refuses the creation without a token', async () => {
    const res = await request(app)
      .post('/lines')
      .send({ name: 'Test line without token', directions: [] });
    expect(res.statusCode).toBe(401);
  });

  it('refuse to create with missing data', async () => {
    const res = await request(app)
      .post('/lines')
      .set('Authorization', adminToken)
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /lines', () => {
  it('returns the list of lines for authenticated user', async () => {
    const res = await request(app)
      .get('/lines')
      .set('Authorization', adminToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('refuse the request without token', async () => {
    const res = await request(app).get('/lines');
    expect(res.statusCode).toBe(401);
  });

  it('filter the lines by name', async () => {
    const res = await request(app)
      .get('/lines?search=Test')
      .set('Authorization', adminToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.some(line => line.name.includes('Test'))).toBe(true);
  });
});

describe('GET /lines/detailed', () => {
  it('returns detailed information about all lines', async () => { 
    const res = await request(app)
      .get('/lines/detailed')
      .set('Authorization', adminToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('stops');
  });

  it('refuse the request without token', async () => {
    const res = await request(app).get('/lines/detailed');
    expect(res.statusCode).toBe(401);
  });
})

describe('PUT /lines/:id', () => {
  it('updates an existing line', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    lineData.name = 'Testing';
    const res = await request(app)
      .put(`/lines/${line._id}`)
      .set('Authorization', adminToken)
      .send(lineData);

    expect(res.statusCode).toBe(200);
  })

  it('refuses to update without a token', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    expect(line).toBeDefined();
    const res = await request(app)
      .put(`/lines/${line._id}`)
      .send({ name: 'Test Updated Again' });
    expect(res.statusCode).toBe(401);
  })

  it('refuses to update with missing data', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    expect(line).toBeDefined();
    const res = await request(app)
      .put(`/lines/${line._id}`)
      .set('Authorization', adminToken)
      .send({});
    expect(res.statusCode).toBe(400);
  })

  it('refuses to update with invalid ID', async () => {
    lineData.name = 'Testing';
    const res = await request(app)
      .put('/lines/invalid-id')
      .set('Authorization', adminToken)
      .send(lineData);
    expect(res.statusCode).toBe(404);
  })
})

describe('GET /lines/:id/complete', () => {
  it('returns complete information about a specific line', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    expect(line).toBeDefined();
    const res = await request(app)
      .get(`/lines/${line._id}/complete`)
      .set('Authorization', adminToken);
    expect(res.statusCode).toBe(200);
    expect(res.body.directions[0]).toHaveProperty('stops');
  })

  it('refuses to get complete info without a token', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    expect(line).toBeDefined();
    const res = await request(app)
      .get(`/lines/${line._id}/complete`);
    expect(res.statusCode).toBe(401);
  })

  it('refuses to get complete info with invalid ID', async () => {
    const res = await request(app)
      .get('/lines/invalid-id/complete')
      .set('Authorization', adminToken);
    expect(res.statusCode).toBe(404);
  })
})

describe('DELETE /lines/:id', () => {
  
  it('refuse to delete without a token', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    expect(line).toBeDefined();
    const res = await request(app)
      .delete(`/lines/${line._id}`);
    expect(res.statusCode).toBe(401);
  })

  it('delete an existing line', async () => {
    const line = await BusLine.findOne({ name: /Test/i });
    expect(line).toBeDefined();
    const res = await request(app)
      .delete(`/lines/${line._id}`)
      .set('Authorization', adminToken);

    expect(res.statusCode).toBe(200);
  })

  it('refuse to delete with invalid ID', async () => {
    const res = await request(app)
      .delete('/lines/invalid-id')
      .set('Authorization', adminToken);
    expect(res.statusCode).toBe(404);
  })

})
