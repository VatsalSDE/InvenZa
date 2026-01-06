import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  try {
    // In demo mode, bypass auth for convenience
    if (String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true') {
      return next();
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}


