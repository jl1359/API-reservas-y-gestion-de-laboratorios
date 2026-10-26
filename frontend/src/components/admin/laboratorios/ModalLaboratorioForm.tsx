import type { FormEvent, Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';
import type { DiaSchedule } from './ModalHorariosLab';
import CampusGeoPicker from './CampusGeoPicker';
import ImageUploaderLab from './ImageUploaderLab';
import HorariosSemanalesLabForm from './HorariosSemanalesLabForm';

export interface LaboratorioFormData {
  nombre: string;
  capacidad: string;
  ubicacion: string;
  latitud: string;
  longitud: string;
  carreraId: string;
  reservaPorComputadora: boolean;
  estadoOperativo: string;
  imagenUrl: string;
}

interface CarreraItem {
  id: number;
  nombre: string;
}

interface ModalLaboratorioFormProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: 'crear' | 'editar';
  formData: LaboratorioFormData;
  setFormData: Dispatch<SetStateAction<LaboratorioFormData>>;
  carreras: CarreraItem[];
  scheduleForm: DiaSchedule[];
  setScheduleForm: Dispatch<SetStateAction<DiaSchedule[]>>;
  onSubmit: (e: FormEvent) => void;
}

export default function ModalLaboratorioForm({
  isOpen,
  onClose,
  modalMode,
  formData,
  setFormData,
  carreras,
  scheduleForm,
  setScheduleForm,
  onSubmit
}: ModalLaboratorioFormProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-poppins font-bold text-slate-900 dark:text-white">
            {modalMode === 'crear' ? 'Nuevo Laboratorio' : `Editar: ${formData.nombre}`}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="labForm" onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Laboratorio
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Capacidad Total
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Carrera Asignada
                </label>
                <select
                  value={formData.carreraId}
                  onChange={(e) => setFormData({ ...formData, carreraId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                >
                  <option value="">Uso General FCyT</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ubicación Física (Aula, Edificio o Bloque)
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Ej. Edificio Electro/Sistemas, Planta Baja"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
              />
            </div>

            {/* Geolocalización en Campus FCyT */}
            <CampusGeoPicker
              formData={formData}
              setFormData={setFormData}
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estado Operativo
              </label>
              <select
                value={formData.estadoOperativo}
                onChange={(e) => setFormData({ ...formData, estadoOperativo: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
              >
                <option value="Activo">Activo</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Carga de Fotografía del Laboratorio */}
            <ImageUploaderLab
              formData={formData}
              setFormData={setFormData}
            />

            {/* Horario Operativo Semanal Inicial (Al crear nuevo laboratorio) */}
            {modalMode === 'crear' && (
              <HorariosSemanalesLabForm
                scheduleForm={scheduleForm}
                setScheduleForm={setScheduleForm}
              />
            )}

            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reservaPorComputadora}
                  onChange={(e) => setFormData({ ...formData, reservaPorComputadora: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-tech-blue focus:ring-tech-blue"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Permitir reserva individual por computadora
                </span>
              </label>
              <p className="text-xs text-slate-400 mt-1 pl-8">
                Si se activa, los estudiantes podrán seleccionar puestos individuales de computadora.
              </p>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="labForm"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-tech-blue hover:bg-blue-600 rounded-xl shadow-md transition cursor-pointer"
          >
            {modalMode === 'crear' ? 'Crear Laboratorio' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}