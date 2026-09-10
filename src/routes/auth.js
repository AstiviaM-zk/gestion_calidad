import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { upsertUserFromGoogle } from '../services/userService.js';

const router = express.Router();

/**
 * GET /api/auth/config
 * Returns public configuration such as GOOGLE_CLIENT_ID
 */
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

/**
 * POST /api/auth/google
 * Receives credential (ID Token) from Google Identity Services,
 * verifies it with Google Auth Library, and returns a JWT session token.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential (ID Token) missing'
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Verify token with Google's OAuth2Client
    const client = new OAuth2Client(clientId);
    let payload;

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' ? clientId : undefined
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google token verification check:', verifyErr.message);
      
      // Fallback for testing environment if client ID is placeholder
      if (clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' || !clientId) {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          payload = decoded;
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid Google Token. Please configure a valid GOOGLE_CLIENT_ID in .env file.',
            details: verifyErr.message
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Google Token verification failed',
          details: verifyErr.message
        });
      }
    }

    const rawUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    };

    // Upsert into real user store
    const user = upsertUserFromGoogle(rawUser);

    // Create session JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Autenticación exitosa',
      token,
      user
    });
  } catch (error) {
    console.error('Error en /api/auth/google:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la autenticación'
    });
  }
});

/**
 * GET /api/auth/me
 * Validates session JWT token and returns current user details
 */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de autorización faltante'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const user = jwt.verify(token, jwtSecret);
    return res.json({
      success: true,
      user
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
});

export default router;
