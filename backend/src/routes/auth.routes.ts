import { Router } from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  loginConGoogle,
  desactivarCuenta 
} from '../controllers/auth.controller';
import { verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (No requieren estar logueado)
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', loginConGoogle);

// Rutas protegidas (Requieren estar logueado con un JWT válido)
// Si el token es válido, verificarToken pasa y ejecuta desactivarCuenta
router.delete('/eliminar-cuenta', verificarToken, desactivarCuenta);

export default router;
