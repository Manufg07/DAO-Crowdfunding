const express = require("express");
const cors = require("cors"); // ✅ Import CORS
const connectDB = require("./config/db");
const campaignRoutes = require("./routes/campaignRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const { setupEventListeners } = require("./services/eventService");

const app = express();

// ✅ Enable CORS for frontend requests
app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/proposals", proposalRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setupEventListeners();
});
