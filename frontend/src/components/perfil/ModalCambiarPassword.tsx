import React, { useState } from 'react';
import { Key, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';

interface ModalCambiarPasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalCambiarPassword({ isOpen, onClose }: ModalCambiarPasswordProps) {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPasswords, setMostrarPasswords] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmarPassword('');
    onClose();
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordActual.trim()) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }
    if (nuevaPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await apiClient.put('/api/auth/cambiar-password', {
        passwordActual,
        nuevaPassword
      });
      toast.success(res.data?.mensaje || 'Contraseña actualizada correctamente');
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 max-h-[92vh] overflow-y-auto my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center">
            <Key className="w-5 h-5 mr-2 text-tech-blue" />
            Cambiar Contraseña
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCambiarPassword} className="mt-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define tu nueva contraseña (mínimo 8 caracteres).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña Actual <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={mostrarPasswords ? 'text' : 'password'}
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Tu contraseña actual"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setMostrarPasswords(!mostrarPasswords)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={mostrarPasswords ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nueva Contraseña <span className="text-rose-500">*</span>
            </label>
            <input
              type={mostrarPasswords ? 'text' : 'password'}
              required
              minLength={8}
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
            </label>
            <input
              type={mostrarPasswords ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite tu nueva contraseña"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 outline-none transition-all"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="px-5 py-2 text-xs font-semibold text-white bg-tech-blue hover:bg-blue-600 active:scale-[0.98] rounded-xl disabled:opacity-50 shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
            >
              {isSubmittingPassword ? (
                <span>Guardando...</span>
              ) : (
                <span>Guardar Contraseña</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
