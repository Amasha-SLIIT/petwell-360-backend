const User = require("../models/userModel");

const getAllUsers = async (req,res,next) => {
    let users;

    try{
        users = await User.find();   
    }catch(err){
        return res.status(500).json({ message: "Internal Server Error", error: err.message });

    }
    //notfound
    if(!users || users.length === 0){
        return res.status(404).json({message:"User notfound"});

    }
    //display all users
    return res.status(200).json({users})
};

//data insert function
const addUsers = async (req, res, next) => {

    const {name, gmail, age, address } = req.body;
    let user;
    try{
        user = new User({name, gmail, age, address});
        await user.save();
    }catch(err){
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }

    //not insert users
    if(!user){
        return res.status(404).send({message:"unable to add user"});
    }
    return res.status(200).json({user});

};

//update user details
const updateUser = async (req,res,next) => {
    const id = req.params.id;
    const {name,gmail,age,address} = req.body;

    let user;

    try{
        user = await User.findByIdAndUpdate(id, { name, gmail, age, address }, { new: true });
    }catch(err){
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }

    if(!user){
        return res.status(404).json({message:"unable to update user details"});
    }
    return res.status(200).json({user});
};

//delete data
const deleteUser = async(req,res,next) => {
    const id = req.params.id;
    let user;

    try{
        user = await User.findByIdAndDelete(id);
    }catch(err){
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
    
    if(!user){
        return res.status(404).json({message:"unable to delete user details"});
    }
    return res.status(200).json({ message: "User deleted successfully" });


}
// exporting for other files to access
exports.getAllUsers = getAllUsers;
exports.addUsers = addUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;