import { Router } from "express";
import { register, login, forgotPassword, resetPassword, loginConGoogle, desactivarCuenta, verificarCorreo, reenviarActivacion, cambiarPassword } from "../controllers/auth.controller";
import { verificarToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.get("/verificar-correo/:token", verificarCorreo);
router.post("/reenviar-activacion", reenviarActivacion);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", loginConGoogle);
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.delete("/eliminar-cuenta", verificarToken, desactivarCuenta);

export default router;