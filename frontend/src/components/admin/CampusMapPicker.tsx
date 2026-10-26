import { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface EdificioFCyT {
  nombre: string;
  descripcion?: string;
  lat: number;
  lng: number;
}

export const EDIFICIOS_OFICIALES_FCYT: EdificioFCyT[] = [
  {
    nombre: 'Edificio de Informática y Sistemas (MEMI)',
    descripcion: 'Laboratorios de Computación, LISI y aulas de Sistemas/Informática',
    lat: -17.393845,
    lng: -66.146210
  },
  {
    nombre: 'Edificio Nuevo de Aulas (Nuevas Aulas FCyT)',
    descripcion: 'Bloque moderno de aulas multidisciplinarias',
    lat: -17.393520,
    lng: -66.146820
  },
  {
    nombre: 'Edificio Central y Decanato FCyT',
    descripcion: 'Decanato, Dirección de Carreras y Auditorio Principal',
    lat: -17.393750,
    lng: -66.145950
  },
  {
    nombre: 'Bloque de Ingeniería Civil e Hidráulica',
    descripcion: 'Laboratorios de Suelos, Materiales e Hidráulica',
    lat: -17.394100,
    lng: -66.146600
  },
  {
    nombre: 'Bloque de Industrial, Mecánica y Electromecánica',
    descripcion: 'Talleres de manufactura, máquinas térmicas y laboratorios industriales',
    lat: -17.394350,
    lng: -66.146100
  },
  {
    nombre: 'Bloque de Química y Alimentos',
    descripcion: 'Laboratorios de química analítica, biotecnología e ingeniería de alimentos',
    lat: -17.394230,
    lng: -66.145810
  },
  {
    nombre: 'Bloque de Física y Matemáticas',
    descripcion: 'Laboratorios de física experimental y departamentos académicos',
    lat: -17.393650,
    lng: -66.146450
  },
  {
    nombre: 'Edificio de Aulas Antiguas / Aula Magna',
    descripcion: 'Pabellón histórico de aulas teóricas y actos facultativos',
    lat: -17.393950,
    lng: -66.145700
  }
];

interface CampusMapPickerProps {
  latitud: string | number;
  longitud: string | number;
  onCoordinatesChange: (lat: string, lng: string) => void;
  onSelectEdificio?: (edificio: EdificioFCyT) => void;
}

export default function CampusMapPicker({
  latitud,
  longitud,
  onCoordinatesChange,
  onSelectEdificio
}: CampusMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);

  const latNum = Number(latitud);
  const lngNum = Number(longitud);
  const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;

  const defaultCenter: [number, number] = hasValidCoords
    ? [latNum, lngNum]
    : [-17.393845, -66.146210];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 18,
        minZoom: 16,
        maxZoom: 19
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Icono personalizado para el pin de posición seleccionada
      const activePinIcon = L.divIcon({
        className: 'custom-active-pin',
        html: `
          <div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white;">
            <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      // Icono para los puntos de referencia de los edificios de la facultad
      const buildingIcon = L.divIcon({
        className: 'custom-building-pin',
        html: `
          <div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 2px solid white;">
            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      // Marcadores de los edificios de la FCyT
      EDIFICIOS_OFICIALES_FCYT.forEach((edificio) => {
        const marker = L.marker([edificio.lat, edificio.lng], { icon: buildingIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 11px;">
            <strong style="color: #1e3a8a; display: block; margin-bottom: 2px;">${edificio.nombre}</strong>
            <span style="color: #64748b; font-size: 10px;">${edificio.descripcion || ''}</span>
          </div>
        `);
        marker.on('click', () => {
          onCoordinatesChange(edificio.lat.toFixed(6), edificio.lng.toFixed(6));
          if (onSelectEdificio) onSelectEdificio(edificio);
        });
      });

      // Marcador activo para la posición del laboratorio
      if (hasValidCoords) {
        activeMarkerRef.current = L.marker([latNum, lngNum], {
          icon: activePinIcon,
          draggable: true
        }).addTo(map);

        activeMarkerRef.current.on('dragend', () => {
          if (activeMarkerRef.current) {
            const pos = activeMarkerRef.current.getLatLng();
            onCoordinatesChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
          }
        });
      }

      // Evento de clic en el mapa para posicionar el pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newLat = e.latlng.lat.toFixed(6);
        const newLng = e.latlng.lng.toFixed(6);

        if (activeMarkerRef.current) {
          activeMarkerRef.current.setLatLng(e.latlng);
        } else {
          activeMarkerRef.current = L.marker(e.latlng, {
            icon: activePinIcon,
            draggable: true
          }).addTo(map);

          activeMarkerRef.current.on('dragend', () => {
            if (activeMarkerRef.current) {
              const pos = activeMarkerRef.current.getLatLng();
              onCoordinatesChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
            }
          });
        }

        onCoordinatesChange(newLat, newLng);
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    } else {
      const map = mapInstanceRef.current;
      if (hasValidCoords) {
        if (activeMarkerRef.current) {
          activeMarkerRef.current.setLatLng([latNum, lngNum]);
        } else {
          const activePinIcon = L.divIcon({
            className: 'custom-active-pin',
            html: `
              <div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white;">
                <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });

          activeMarkerRef.current = L.marker([latNum, lngNum], {
            icon: activePinIcon,
            draggable: true
          }).addTo(map);

          activeMarkerRef.current.on('dragend', () => {
            if (activeMarkerRef.current) {
              const pos = activeMarkerRef.current.getLatLng();
              onCoordinatesChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
            }
          });
        }
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        activeMarkerRef.current = null;
      }
    };
  }, []);

  // Centrar mapa si las coordenadas cambian externamente
  useEffect(() => {
    if (mapInstanceRef.current && hasValidCoords) {
      if (activeMarkerRef.current) {
        activeMarkerRef.current.setLatLng([latNum, lngNum]);
      }
      mapInstanceRef.current.panTo([latNum, lngNum], { animate: true });
    }
  }, [latitud, longitud]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-64 bg-slate-100 dark:bg-slate-900 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        <div className="absolute top-2 right-2 z-[400] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 pointer-events-none flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-medium">Haz clic en cualquier punto del campus para fijar el pin</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([-17.393845, -66.146210], 18);
            }
          }}
          className="absolute bottom-2 left-2 z-[400] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold shadow-md border border-slate-200 dark:border-slate-700 transition-colors"
        >
          Centrar en Campus FCyT
        </button>
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span>Puntos azules: Edificios principales de la facultad</span>
        <span>Pin rojo: Ubicación exacta del laboratorio (arrastrable)</span>
      </div>
    </div>
  );
}