const mongoose = require("mongoose");

// Define the schema for the Inventory model
const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // The name of the inventory item is required
  },
  category: {
    type: String,
    required: true, // Category of the item is required
  },
  quantity: {
    type: Number,
    required: true, // Quantity of the item is required
    default: 0, // Default quantity is 0
  },
  threshold: {
    type: Number,
    required: true, // Threshold value is required (minimum stock level)
  },
  image: {
    type: String,
    required: true,
  },
  usageCount: { //************************ */
    type: Number, 
    default: 0 
  }, 
});

// Create and export the Inventory model
const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
