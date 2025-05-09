
const Inventory = require("../models/inventoryModel");
const path = require("path");

// Create a new inventory item with image upload
exports.createInventoryItem = async (req, res) => {
  try {
    const { name, category, quantity, threshold } = req.body;
    const image = req.file ? req.file.filename : null; // Store the image filename

    // Create a new inventory item
    const newItem = new Inventory({
      name,
      category,
      quantity,
      threshold,
      image: image, // Save the image filename
    });

    // Save the item to the database
    await newItem.save();

    res.status(201).json({
      ...newItem._doc,
      imageUrl: image ? `http://localhost:5000/uploads/${image}` : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all inventory items
exports.getAllInventoryItems = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find();
    res.status(200).json(inventoryItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single inventory item by ID
exports.getInventoryItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an inventory item by ID with image upload support
exports.updateInventoryItem = async (req, res) => {
  try {
    const updatedItemData = {
      name: req.body.name,
      category: req.body.category,
      quantity: req.body.quantity,
      threshold: req.body.threshold,
    };

    if (req.file) {
      updatedItemData.image = req.file.filename; // Update the image only if a new one is uploaded
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      updatedItemData,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      ...updatedItem._doc,
      imageUrl: updatedItem.image
        ? `http://localhost:5000/uploads/${updatedItem.image}`
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an inventory item by ID
exports.deleteInventoryItem = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// the usage dashboard part
// Get items that are below the threshold
exports.getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ quantity: { $lt: 5 } }); // Assuming 5 is the threshold for low stock
    res.status(200).json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//*****************************************
exports.addUsageToInventoryItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { usedCount } = req.body;

    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.quantity < usedCount) {
      return res.status(400).json({ message: "Not enough stock to deduct this amount" });
    }

    item.quantity -= usedCount;
    item.usageCount = (item.usageCount || 0) + usedCount; // Add usageCount field dynamically if not exist
    await item.save();

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get most used (highest quantity) and least used (lowest quantity) items
exports.getInventoryUsageStats = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find();

    const sortedByUsage = [...inventoryItems].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    const mostUsed = sortedByUsage.slice(0, 5);
    const leastUsed = sortedByUsage.slice(-5);
    const lowStock = inventoryItems.filter(item => item.quantity < item.threshold);

    res.status(200).json({
      mostUsed,
      leastUsed,
      lowStock,
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error.message);
    res.status(500).json({ message: "Server error while fetching stats" });
  }
};




//*********************************************** */