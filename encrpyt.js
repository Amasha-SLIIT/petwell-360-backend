const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const PetOwnerModel = require('./models/petOwnerModel');  // Adjust path if needed

// Check if MongoDB connection is active
if (mongoose.connection.readyState === 0) {
  mongoose.connect('mongodb://localhost:27017/your-database-name', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000 
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));
}

// Function to update password
async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('securePassword123', 10);

    const result = await PetOwnerModel.updateOne(
      { email: 'johndoe@example.com' },  // Adjust the condition as needed
      { $set: { password: hashedPassword } }
    );

    if (result.nModified > 0) {
      console.log('Password updated successfully');
    } else {
      console.log('No matching user found or password already up-to-date');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

updatePassword();
