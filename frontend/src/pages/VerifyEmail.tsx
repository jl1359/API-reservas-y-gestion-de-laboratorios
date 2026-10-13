import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axios.get(`http://localhost:3000/api/auth/verificar-correo/${token}`);
        setStatus('success');
        setMessage('¡Tu correo electrónico ha sido verificado con éxito!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'El enlace de verificación es inválido o ha expirado.');
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-inter transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-tech-blue animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verificando...</h2>
            <p className="text-sm text-slate-500 mt-2">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <MailCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">¡Cuenta Activada!</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">{message}</p>
            <Link to="/login" className="w-full bg-tech-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">Error de Verificación</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">{message}</p>
            <Link to="/login" className="text-tech-blue hover:underline font-medium">
              Volver al inicio
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}