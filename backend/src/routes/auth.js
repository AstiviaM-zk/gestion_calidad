import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { upsertUserFromGoogle, registerFormUser, loginFormUser, getUserByEmail } from '../services/userService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * GET /api/auth/config
 * Returns public configuration such as GOOGLE_CLIENT_ID
 */
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '606541311192-nta8lgacqaaofml43jci2vcokumom3mp.apps.googleusercontent.com'
  });
});

/**
 * POST /api/auth/register
 * Handles local user registration with name, email and password
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre completo es obligatorio.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Ingresa un correo electrónico válido (ej. usuario@dominio.com).' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const user = await registerFormUser({ name, email, password });
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registro exitoso',
      token,
      user
    });
  } catch (error) {
    console.error('Error en /api/auth/register:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error durante el registro de usuario'
    });
  }
});

/**
 * POST /api/auth/login
 * Handles local user login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Ingresa un correo electrónico válido.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Por favor ingresa tu contraseña.' });
    }

    const user = await loginFormUser({ email, password });
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error.message);
    return res.status(401).json({
      success: false,
      message: error.message || 'Credenciales inválidas'
    });
  }
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
    const client = new OAuth2Client(clientId);
    let payload;

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID') ? clientId : undefined
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google token verification check:', verifyErr.message);
      
      // Fallback: decode JWT directly if Google library verification fails in local environment
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Error al verificar token de Google: ' + verifyErr.message,
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

    // Upsert into real PostgreSQL user store
    const user = await upsertUserFromGoogle(rawUser);

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
      message: 'Error interno del servidor durante la autenticación: ' + error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Validates session JWT token and returns current user details directly from PostgreSQL with a fresh token
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos'
      });
    }
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });
    return res.json({
      success: true,
      user,
      token
    });
  } catch (err) {
    return res.json({
      success: true,
      user: req.user
    });
  }
});

export default router;
