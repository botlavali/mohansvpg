import jwt from "jsonwebtoken";
export default function adminAuth(req, res, next) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  const token = h.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET || "adminSecretKey");
    req.adminId = payload.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}
