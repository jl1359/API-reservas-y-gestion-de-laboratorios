import { useState, useRef, type ChangeEvent, type DragEvent, type Dispatch, type SetStateAction } from 'react';
import { CheckCircle2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { comprimirYConvertirABase64 } from '../../../utils/imageCompressor';
import type { LaboratorioFormData } from './ModalLaboratorioForm';

interface ImageUploaderLabProps {
  formData: LaboratorioFormData;
  setFormData: Dispatch<SetStateAction<LaboratorioFormData>>;
}

export default function ImageUploaderLab({
  formData,
  setFormData
}: ImageUploaderLabProps) {
  const [modoCargaImagen, setModoCargaImagen] = useState<'archivo' | 'url'>('archivo');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcesandoImagen, setIsProcesandoImagen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarArchivoImagen = async (file: File) => {
    setIsProcesandoImagen(true);
    try {
      const dataUrl = await comprimirYConvertirABase64(file);
      setFormData((prev) => ({ ...prev, imagenUrl: dataUrl }));
      toast.success('Fotografía procesada y optimizada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo procesar la fotografía');
    } finally {
      setIsProcesandoImagen(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      procesarArchivoImagen(files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      procesarArchivoImagen(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        Fotografía del Espacio Físico (Opcional)
      </label>

      {formData.imagenUrl ? (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center space-x-3.5 w-full sm:w-auto overflow-hidden">
            <img
              src={formData.imagenUrl}
              alt="Vista previa del laboratorio"
              className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500 shrink-0" />
                Fotografía cargada y optimizada
              </p>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {formData.imagenUrl.startsWith('data:')
                  ? 'Archivo procesado localmente en alta fidelidad'
                  : formData.imagenUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs transition cursor-pointer"
            >
              Cambiar foto
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, imagenUrl: '' })}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 transition cursor-pointer"
            >
              Quitar
            </button>
          </div>
        </div>
      ) : modoCargaImagen === 'archivo' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-tech-blue bg-blue-50/60 dark:bg-blue-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-tech-blue dark:hover:border-tech-blue bg-slate-50/60 dark:bg-slate-900/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/60 rounded-2xl text-tech-blue">
              <UploadCloud className="w-6 h-6" />
            </div>
            {isProcesandoImagen ? (
              <p className="text-sm font-semibold text-tech-blue animate-pulse">
                Procesando y optimizando imagen...
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Arrastra tu fotografía aquí o{' '}
                  <span className="text-tech-blue underline">selecciona desde tu equipo</span>
                </p>
                <p className="text-xs text-slate-400">
                  Formatos admitidos: PNG, JPG, JPEG, WebP (Se escala y optimiza automáticamente)
                </p>
              </>
            )}
          </div>

          <div className="mt-3.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModoCargaImagen('url');
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-tech-blue underline cursor-pointer"
            >
              O ingresar mediante enlace web (URL)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={formData.imagenUrl}
            onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
            placeholder="https://ejemplo.com/fotografia.jpg"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none text-sm"
          />
          <div className="flex justify-between items-center text-xs px-1">
            <span className="text-slate-400">Pega un enlace web público hacia la imagen</span>
            <button
              type="button"
              onClick={() => setModoCargaImagen('archivo')}
              className="text-tech-blue hover:underline font-semibold cursor-pointer"
            >
              Volver a subir desde el equipo
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
