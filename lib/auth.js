import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("drivefleet");

export const auth = betterAuth({
    database: mongodbAdapter(db, {
         baseURL: process.env.BETTER_AUTH_URL,
        client, // Enables database transactions if supported by the cluster
    }),
    trustedOrigins: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
    },
    // Adding mock Google auth, typically you'd need client ID and secret
    socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID || "mock_id", 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_secret" 
        }
    }
});
