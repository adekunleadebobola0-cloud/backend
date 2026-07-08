import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey';

export const generateTokens = (id: string, role: string) => {
  const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return { token, refreshToken };
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
