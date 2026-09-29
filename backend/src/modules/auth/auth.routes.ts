import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, loginConGoogle } from './auth.controller';

const router = Router();

// Rutas: POST /api/auth/register y POST /api/auth/login
router.post('/register', register);
router.post('/login', login);

export default router;

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/google', loginConGoogle);
