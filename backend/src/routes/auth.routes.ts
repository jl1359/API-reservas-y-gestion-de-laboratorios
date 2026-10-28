import { Router } from "express";
import { register, login, forgotPassword, resetPassword, loginConGoogle, desactivarCuenta, verificarCorreo, reenviarActivacion, cambiarPassword } from "../controllers/auth.controller";
import { verificarToken } from "../middlewares/auth.middleware";
import { authRateLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/register", authRateLimiter, register);
router.get("/verificar-correo/:token", verificarCorreo);
router.post("/reenviar-activacion", authRateLimiter, reenviarActivacion);
router.post("/login", authRateLimiter, login);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);
router.post("/google", authRateLimiter, loginConGoogle);
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.delete("/eliminar-cuenta", verificarToken, desactivarCuenta);

export default router;