import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-erp-secret-key-2024-change-in-production';
const JWT_EXPIRY = '24h';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, sector_id: user.sector_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function authMiddleware(req, res, next) {
  // Accept token from Authorization header OR from ?token= query param
  // (query param is needed for direct browser downloads that bypass the Vite proxy)
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export default { generateToken, authMiddleware };
