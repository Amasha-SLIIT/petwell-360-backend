
const express = require("express");
const multer = require("multer"); //to handle image uploading



const {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
  addUsageToInventoryItem,//********************* */
  getInventoryUsageStats,//********************* */
} = require("../controllers/inventoryController");

const router = express.Router();

// Set up storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Route to create a new inventory item with image upload
router.post("/add", upload.single("image"), createInventoryItem);

// Route to get all inventory items
router.get("/", getAllInventoryItems);
//************ */
router.get("/usage-stats", getInventoryUsageStats);
router.get("/low-stock", getLowStockItems);


// Route to get a single inventory item by ID
router.get("/:id", getInventoryItemById);

// Route to update an inventory item by ID (with optional image upload)
router.put("/:id", upload.single("image"), updateInventoryItem);

// Route to delete an inventory item by ID
router.delete("/:id", deleteInventoryItem);

// Route to get items below threshold (low stock)

//************************************* */
router.post("/:id/add-usage", addUsageToInventoryItem);




//**************************** */

module.exports = router;