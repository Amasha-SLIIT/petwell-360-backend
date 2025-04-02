const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log(" No valid Authorization header provided!");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        console.log(" Token verified! User ID:", decoded.id);
        next(); 
    } catch (error) {
        console.error(" Invalid token:", error.message);
        const errorMessage = error.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
        return res.status(403).json({ message: errorMessage });
    }
};

module.exports = { verifyToken };
