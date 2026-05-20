import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

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
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Mount Better Auth handler BEFORE express.json() - Express v5 uses /*splat
app.all("/api/auth/{*splat}", toNodeHandler(auth));

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
    //await client.db("admin").command({ ping: 1 });
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

    // Seed database if empty
    try {
      const count = await carsCollection.countDocuments();
      if (count === 0) {
        console.log("Seeding sample cars into MongoDB database...");
        await carsCollection.insertMany([
          {
            modelName: "Model S Plaid",
            brand: "Tesla",
            type: "Electric",
            price: 120,
            imageUrl: "https://images.pexels.com/photos/11139552/pexels-photo-11139552.jpeg?auto=compress&cs=tinysrgb&w=800",
            availability: "Available",
            status: "Available",
            description: "Experience the future of driving with the ultimate electric sports sedan. 1020 horsepower, state-of-the-art tech, and luxury styling.",
            features: ["Autopilot", "Premium Audio", "Panoramic Roof", "Heated Seats"],
            capacity: 5,
            addedBy: "admin@drivefleet.com",
            booking_count: 5,
            createdAt: new Date(Date.now() - 6 * 3600000)
          },
          {
            modelName: "Sport",
            brand: "Range Rover",
            type: "SUV",
            price: 150,
            imageUrl: "https://images.pexels.com/photos/1007431/pexels-photo-1007431.jpeg?auto=compress&cs=tinysrgb&w=800",
            availability: "Available",
            status: "Available",
            description: "The pinnacle of luxury SUVs. Unmatched off-road capability combined with a beautifully crafted interior and powerful hybrid engine.",
            features: ["4WD", "Air Suspension", "3D Surround Camera", "Meridian Sound"],
            capacity: 7,
            addedBy: "admin@drivefleet.com",
            booking_count: 8,
            createdAt: new Date(Date.now() - 5 * 3600000)
          },
          {
            modelName: "911 GT3",
            brand: "Porsche",
            type: "Luxury",
            price: 250,
            imageUrl: "https://images.pexels.com/photos/3842567/pexels-photo-3842567.jpeg?auto=compress&cs=tinysrgb&w=800",
            availability: "Available",
            status: "Available",
            description: "Track-bred performance for the open road. Heart-stopping acceleration, flawless handling, and the iconic Porsche silhouette.",
            features: ["PDK Transmission", "Sport Exhaust", "Carbon Seats", "Bose Audio"],
            capacity: 2,
            addedBy: "admin@drivefleet.com",
            booking_count: 12,
            createdAt: new Date(Date.now() - 4 * 3600000)
          },
          {
            modelName: "iX M60",
            brand: "BMW",
            type: "Electric",
            price: 140,
            imageUrl: "https://images.pexels.com/photos/8925227/pexels-photo-8925227.jpeg?auto=compress&cs=tinysrgb&w=800",
            availability: "Available",
            status: "Available",
            description: "Bold, spacious, and completely electric. Features high-performance M engineering and an absolute vanguard glass interior cockpit.",
            features: ["Integral Active Steering", "Bowers & Wilkins Sound", "Sky Lounge Roof"],
            capacity: 5,
            addedBy: "admin@drivefleet.com",
            booking_count: 3,
            createdAt: new Date(Date.now() - 3 * 3600000)
          },
          {
            modelName: "A8 L",
            brand: "Audi",
            type: "Sedan",
            price: 110,
            imageUrl: "https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800",
            availability: "Available",
            status: "Available",
            description: "Executive luxury sedan offering absolute comfort, virtual cockpit dual screens, and whisper-quiet ride mechanics.",
            features: ["Quattro AWD", "Rear Executive Seats", "Matrix LED", "Valcona Leather"],
            capacity: 5,
            addedBy: "admin@drivefleet.com",
            booking_count: 4,
            createdAt: new Date(Date.now() - 2 * 3600000)
          },
          {
            modelName: "G63 AMG",
            brand: "Mercedes-Benz",
            type: "SUV",
            price: 300,
            imageUrl: "https://images.pexels.com/photos/10394779/pexels-photo-10394779.jpeg?auto=compress&cs=tinysrgb&w=800",
            availability: "Available",
            status: "Available",
            description: "The legendary G-Wagon. Brutal V8 twin-turbo power, status-defining exterior, and ultra-high-end bespoke leather tailoring.",
            features: ["AMG Ride Control", "Triple Locking Diffs", "Burmester 3D Sound"],
            capacity: 5,
            addedBy: "admin@drivefleet.com",
            booking_count: 15,
            createdAt: new Date(Date.now() - 1 * 3600000)
          }
        ]);
        console.log("Seeding complete!");
      }
    } catch (err) {
      console.error("Error seeding database:", err);
    }

    const formatCar = (car) => {
      if (!car) return car;
      return {
        ...car,
        status: car.status || car.availability || "Available",
        booking_count: car.booking_count !== undefined ? car.booking_count : 0
      };
    };

    // Add a Car
    app.post('/cars', verifyToken, async (req, res) => {
      const car = req.body;
      car.addedBy = req.user.email;
      car.booking_count = 0; // Initialize booking count
      car.status = car.status || "Available";
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
      res.send(cars.map(formatCar));
    });

    // Get recent cars (limit 6)
    app.get('/cars/recent', async (req, res) => {
      const cars = await carsCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.send(cars.map(formatCar));
    });

    // Get My Added Cars
    app.get('/my-cars', verifyToken, async (req, res) => {
      const email = req.user.email;
      const query = { addedBy: email };
      const cars = await carsCollection.find(query).toArray();
      res.send(cars.map(formatCar));
    });

    // Get Single Car by ID
    app.get('/cars/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const car = await carsCollection.findOne(query);
      res.send(formatCar(car));
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
      booking.bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date(); // Support user-selected date or fallback to new Date()

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

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port: ${port}`);
    });
}

export default app;
