import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Sun, Moon } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

interface Carrera {
  id: number;
  nombre: string;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const navigate = useNavigate();

  // Modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/carreras');
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
      await axios.post('http://localhost:3000/api/auth/forgot-password', { correo: forgotEmail });
      toast.success('Si el correo existe, se enviará un enlace de recuperación');
      setIsForgotModalOpen(false);
      setForgotEmail('');
    } catch (error) {
      toast.error('Error al solicitar recuperación');
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
        const response = await axios.post('http://localhost:3000/api/auth/login', { correo, password });
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
        await axios.post('http://localhost:3000/api/auth/register', {
          nombreCompleto, correo, password, telefono, carreraId: Number(carreraId)
        });
        toast.success('Cuenta creada exitosamente. Revisa tu correo.');
        setIsLogin(true); 
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ocurrió un error en el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      const res = await axios.post('http://localhost:3000/api/auth/google', {
        token: credentialResponse.credential
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userRole', res.data.usuario.rol);
      toast.success(res.data.mensaje || 'Sesión iniciada con Google');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fallo la autenticación con Google');
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
              Sistema de Gestión
            </span>
          </h1>

          <p className="text-blue-100 text-lg font-medium">
            Ingresa al sistema para buscar, comparar y reservar laboratorios de las carreras de la Facultad de Ciencias y Tecnología.
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Teléfono / Celular</label>
                  <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Correo Institucional</label>
              <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm text-slate-900 dark:text-white focus:ring-tech-blue focus:border-tech-blue" />
            </div>

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
                <span className="px-2 bg-slate-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400">Acceso Institucional</span>
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
            {isLogin ? '¿Personal nuevo? ' : '¿Ya tienes cuenta? '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-tech-blue hover:text-blue-500">
              {isLogin ? 'Solicitar acceso' : 'Ingresar'}
            </button>
          </p>

        </div>
            {/* Modal Olvidé Contraseña */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setIsForgotModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">X</button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Recuperar Contraseña</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Ingresa tu correo institucional y te enviaremos un enlace.</p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input type="email" required placeholder="correo@est.umss.edu" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none" />
              <button type="submit" className="w-full bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors">Enviar Enlace</button>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}