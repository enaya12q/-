import express from "express";
import dotenv from "dotenv";
import adsRoutes from "./routes/ads.js";
import walletRoutes from "./routes/wallet.js"; // Import wallet routes

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/api/ads", adsRoutes);
app.use("/api/wallet", walletRoutes); // Use wallet routes

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
