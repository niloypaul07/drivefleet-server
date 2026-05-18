import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS must be configured properly for credentials to work with Better Auth
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Mount Better Auth handler BEFORE express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// Global Middleware
app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function run() {
  try {
    // await client.connect();
    db = client.db("drivefleet");
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Custom Middleware to verify Better Auth Session
    const verifyToken = async (req, res, next) => {
      try {
        const session = await auth.api.getSession({
          headers: req.headers
        });
        if (!session) {
          return res.status(401).send({ message: 'Unauthorized access' });
        }
        req.user = session.user;
        next();
      } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access' });
      }
    };

    // ====== ROUTES ======
    
    app.get('/', (req, res) => {
        res.send('DriveFleet Server is running');
    });

    const carsCollection = db.collection("cars");
    const bookingsCollection = db.collection("bookings");

    // Add a Car
    app.post('/cars', verifyToken, async (req, res) => {
      const car = req.body;
      car.addedBy = req.user.email;
      car.booking_count = 0; // Initialize booking count
      car.createdAt = new Date();
      const result = await carsCollection.insertOne(car);
      res.send(result);
    });

    // Get all cars (with search and filter)
    app.get('/cars', async (req, res) => {
      const search = req.query.search;
      const type = req.query.type;
      
      let query = {};
      if (search) {
        query.modelName = { $regex: search, $options: 'i' };
      }
      if (type && type !== 'All') {
        query.type = type; // Using exact match, or use $in for array
      }

      const cars = await carsCollection.find(query).toArray();
      res.send(cars);
    });

    // Get recent cars (limit 6)
    app.get('/cars/recent', async (req, res) => {
      const cars = await carsCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.send(cars);
    });

    // Get My Added Cars
    app.get('/my-cars', verifyToken, async (req, res) => {
      const email = req.user.email;
      const query = { addedBy: email };
      const cars = await carsCollection.find(query).toArray();
      res.send(cars);
    });

    // Get Single Car by ID
    app.get('/cars/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const car = await carsCollection.findOne(query);
      res.send(car);
    });

    // Update a Car
    app.put('/cars/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedCar = req.body;
      const filter = { _id: new ObjectId(id), addedBy: req.user.email }; // Ensure ownership
      
      const updateDoc = {
        $set: {
          modelName: updatedCar.modelName,
          price: updatedCar.price,
          type: updatedCar.type,
          image: updatedCar.image,
          seats: updatedCar.seats,
          location: updatedCar.location,
          description: updatedCar.description,
          status: updatedCar.status,
          updatedAt: new Date()
        },
      };

      const result = await carsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete a Car
    app.delete('/cars/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id), addedBy: req.user.email }; // Ensure ownership
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });

    // ====== BOOKINGS ======

    // Add a Booking
    app.post('/bookings', verifyToken, async (req, res) => {
      const booking = req.body;
      booking.userEmail = req.user.email;
      booking.bookingDate = new Date(); // Explore new Date() as requested

      // Increment booking_count
      const carFilter = { _id: new ObjectId(booking.carId) };
      const updateDoc = {
        $inc: { booking_count: 1 }
      };
      
      await carsCollection.updateOne(carFilter, updateDoc);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // Get My Bookings
    app.get('/my-bookings', verifyToken, async (req, res) => {
      const email = req.user.email;
      const query = { userEmail: email };
      const bookings = await bookingsCollection.find(query).sort({ bookingDate: -1 }).toArray();
      res.send(bookings);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
