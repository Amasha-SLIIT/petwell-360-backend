const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    console.log("🔍 Checking Authorization Header:", req.headers.authorization);

    const token = req.headers.authorization?.split(" ")[1]; // Extract token

    if (!token) {
        console.log("❌ No token provided!");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("✅ Token verified! User ID:", decoded.id);
        next();
    } catch (error) {
        console.log("❌ Invalid token:", error);
        return res.status(403).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
