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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export default { generateToken, authMiddleware };
