import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmar) {
      return toast.error('Las contraseñas no coinciden');
    }
    if (nuevaContrasena.length < 6) {
      return toast.error('La contraseña debe tener al menos 6 caracteres');
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:3000/api/auth/reset-password', { token, nuevaContrasena });
      toast.success('Contraseña actualizada correctamente');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-tech-blue/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-tech-blue" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white font-poppins">
          Restablecer Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Ingresa tu nueva contraseña para acceder a LabReserve.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-3xl sm:px-10 border border-slate-200 dark:border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Nueva Contraseña</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-tech-blue focus:border-tech-blue sm:text-sm bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirmar Contraseña</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-tech-blue focus:border-tech-blue sm:text-sm bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-tech-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tech-blue transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Actualizando...' : 'Guardar Contraseña'}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
             <Link to="/login" className="text-sm font-medium text-tech-blue hover:text-blue-500">
               Volver al inicio de sesión
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}