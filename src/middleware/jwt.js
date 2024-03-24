import jwt from 'jsonwebtoken';
import { config } from "dotenv";
config({ path: '.env' })

export const createToken = (data) => {
  const accessToken = jwt.sign(
    { id: data.id, name: data.name, email: data.email, signature: data.signature },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  return { accessToken };
} 

export const createRefreshToken = (data) => {

  const refreshToken = jwt.sign(
    { id: data.id, name: data.name, email: data.email, signature: data.signature },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  return { refreshToken };
}

export const verifyToken = async (req, res, next) => {
  try {
    const { authorization } = req.headers
    const token = authorization && authorization.split(' ')[1];

    if (token == null) {
      return res.status(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.email = decoded.email;
      next();
    })

  } catch (err) {
    return res.status(500).json({
      status: 'fail',
      message: err.message
    })
  }


}