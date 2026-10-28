import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Sun, Moon, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

interface Carrera {
  id: number;
  nombre: string;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTelefono] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [mostrarReenvioActivacion, setMostrarReenvioActivacion] = useState(false);
  const [correoPendienteVerificacion, setCorreoPendienteVerificacion] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  // Modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const res = await apiClient.get('/api/carreras');
        setCarreras(res.data);
      } catch (error) {
        console.error('Error al cargar carreras', error);
      }
    };
    fetchCarreras();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

    const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      await apiClient.post('/api/auth/forgot-password', { correo: forgotEmail });
      toast.success('Enlace de recuperación enviado. Revisa tu bandeja de entrada o spam.');
      setIsForgotModalOpen(false);
      setForgotEmail('');
    } catch (error) {
      toast.error('No se pudo enviar la solicitud. Inténtalo nuevamente.');
    }
  };

  const handleReenviarActivacion = async () => {
    const correoDestino = (correoPendienteVerificacion || correo).trim();
    if (!correoDestino) {
      toast.error('Por favor, ingresa tu correo electrónico');
      return;
    }
    setIsResending(true);
    try {
      const res = await apiClient.post('/api/auth/reenviar-activacion', { correo: correoDestino });
      toast.success(res.data?.mensaje || 'Enlace reenviado. Revisa tu bandeja de entrada o spam.');
      setMostrarReenvioActivacion(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al reenviar enlace de activación');
    } finally {
      setIsResending(false);
    }
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await apiClient.post('/api/auth/login', { correo, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.usuario.rol);
        toast.success('Sesión iniciada correctamente');
        navigate('/'); 
      } else {
        if (!carreraId) {
          toast.error('Por favor, selecciona tu carrera');
          setIsLoading(false);
          return;
        }
        if (!ci.trim()) {
          toast.error('La Cédula de Identidad (CI) es obligatoria');
          setIsLoading(false);
          return;
        }
        if (!telefono.trim() || telefono.trim().length < 7) {
          toast.error('El número de celular o teléfono es obligatorio (mínimo 7 dígitos)');
          setIsLoading(false);
          return;
        }
        const correoRegistrado = correo.trim();
        await apiClient.post('/api/auth/register', {
          nombreCompleto,
          correo: correoRegistrado,
          password,
          ci: ci.trim(),
          telefono: telefono.trim(),
          carreraId: Number(carreraId)
        });
        toast.success('Cuenta registrada con éxito. Revisa tu correo para activarla.');
        setIsLogin(true); 
        setPassword('');
        setCi('');
        setNombreCompleto('');
        setCorreo(correoRegistrado);
        setTelefono('');
        setCarreraId('');
        setCorreoPendienteVerificacion(correoRegistrado);
        setMostrarReenvioActivacion(true);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'No pudimos procesar la solicitud. Inténtalo de nuevo.';
      toast.error(errorMsg);
      if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('verificar tu correo')) {
        setCorreoPendienteVerificacion(correo.trim());
        setMostrarReenvioActivacion(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post('/api/auth/google', {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.usuario.rol);
      toast.success(res.data.mensaje || 'Sesión iniciada con Google');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  if (localStorage.getItem('token')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex font-inter bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative">
      
      {/* Botón de Modo Oscuro en Login */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={toggleDarkMode}
          className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm backdrop-blur-sm transition-all"
          title="Alternar Modo Oscuro"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Panel Izquierdo: Presentación (Oculto en móviles) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-tech-indigo via-tech-blue to-blue-400 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center max-w-lg">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 dark:bg-white/5 p-5 rounded-3xl backdrop-blur-sm border border-white/20">
              <LogoIcon className="text-white w-16 h-16" />
            </div>
          </div>
          
          <div className="inline-flex items-center space-x-2 bg-white/10 dark:bg-white/5 px-4 py-1.5 rounded-full text-white text-sm font-medium mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span>FCyT · Universidad Mayor de San Simón</span>
          </div>

          <h1 className="text-5xl font-poppins font-extrabold text-white tracking-tight mb-6 leading-tight">
            LabReserve <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Sistema de Gestión y Reservas
            </span>
          </h1>

          <p className="text-blue-100 text-lg font-medium">
            Sistema de gestión y reserva de laboratorios de la FCyT.
          </p>
        </div>
        
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-900 blur-3xl"></div>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-24">
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 lg:hidden">
          <div className="flex justify-center mb-4">
            <div className="bg-umss-blue dark:bg-indigo-900 p-3 rounded-2xl shadow-lg">
              <LogoIcon className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="text-center text-3xl font-poppins font-bold text-slate-900 dark:text-white">LabReserve</h2>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-3xl font-poppins font-bold text-slate-900 dark:text-white mb-2">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
            {isLogin ? 'Ingresa tus credenciales para acceder al sistema.' : 'Completa los datos para tener acceso al sistema de reservas.'}
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre Completo</label>
                  <input type="text" required value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Carrera (Obligatorio)</label>
                  <select required value={carreraId} onChange={(e) => setCarreraId(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue">
                    <option value="" disabled>Selecciona tu carrera...</option>
                    {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Cédula de Identidad (CI) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1234567 o 1234567-LP"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Teléfono / Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 71234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Correo Institucional</label>
              <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
                {isLogin && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarReenvioActivacion(true);
                        setCorreoPendienteVerificacion(correo);
                      }}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                    >
                      Activar cuenta
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (correo) setForgotEmail(correo);
                        setIsForgotModalOpen(true);
                      }}
                      className="text-xs font-semibold text-tech-blue hover:text-blue-500 hover:underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 pr-11 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {isLogin && mostrarReenvioActivacion && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">¿No recibiste el correo de activación?</span>
                  <button 
                    type="button" 
                    onClick={() => setMostrarReenvioActivacion(false)}
                    className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-100 p-0.5"
                    title="Cerrar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                  Si tu cuenta está pendiente o el enlace expiró, podemos reenviar el enlace a <span className="font-semibold">{correoPendienteVerificacion || correo || 'tu correo'}</span>.
                </p>
                <button
                  type="button"
                  onClick={handleReenviarActivacion}
                  disabled={isResending}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition shadow-sm text-center disabled:opacity-50 cursor-pointer"
                >
                  {isResending ? 'Reenviando enlace...' : 'Reenviar enlace de activación'}
                </button>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-umss-blue hover:bg-blue-800 disabled:opacity-50 transition-all mt-4">
              {isLoading ? 'Procesando...' : (isLogin ? 'Ingresar al Sistema' : 'Registrarse')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400">Acceso mediante correo Google</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Error al conectar con Google')}
                theme="outline"
                size="large"
                width={320}
                text={isLogin ? 'signin_with' : 'signup_with'}
              />
            </div>
          </div>
          
          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-tech-blue hover:text-blue-500 cursor-pointer">
              {isLogin ? 'Crear nueva cuenta' : 'Iniciar sesión'}
            </button>
          </p>

        </div>
            {/* Modal Olvidé Contraseña */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto my-auto">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 rounded-2xl text-tech-blue">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-poppins text-slate-900 dark:text-white">Recuperar Contraseña</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Recupera el acceso a tu cuenta</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Te enviaremos un enlace para definir una nueva contraseña.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@fcyt.umss.edu.bo"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-tech-blue text-sm"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-1/2 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  Enviar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}