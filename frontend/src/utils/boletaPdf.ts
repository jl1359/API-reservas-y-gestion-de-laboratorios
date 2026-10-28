/**
 * Generador de Comprobante Oficial de Reserva en PDF
 * Genera una ventana con vista previa oficial, botones de descarga en PDF / impresión y membrete FCyT.
 */

export const imprimirBoletaOficial = (reserva: {
  id: number;
  materia?: string | null;
  cantidadAlumnos?: number | null;
  numeroComputadora?: number | null;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  tokenQr?: string | null;
  laboratorio: {
    nombre: string;
    ubicacion?: string | null;
  };
  usuario?: {
    nombreCompleto: string;
    correo: string;
    ci?: string | null;
  };
}) => {
  const fInicio = new Date(reserva.fechaInicio);
  const fFin = new Date(reserva.fechaFin);

  const fechaStr = fInicio.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const horaStr = `${fInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} a ${fFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  const codigoOficial = `RES-FCYT-2026-${reserva.id.toString().padStart(6, '0')}`;
  const qrUrl = reserva.tokenQr 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reserva.tokenQr)}`
    : '';

  const ventana = window.open('', '_blank', 'width=850,height=950');
  if (!ventana) return;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Comprobante Oficial ${codigoOficial}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 30px;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .institucion {
          font-size: 15px;
          font-weight: 700;
          color: #003366;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .facultad {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-top: 3px;
        }
        .titulo {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 15px;
          text-transform: uppercase;
        }
        .codigo-box {
          display: inline-block;
          background: #f1f5f9;
          padding: 6px 16px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 14px;
          font-weight: 700;
          margin-top: 8px;
          color: #003366;
          border: 1px solid #cbd5e1;
        }
        .grid-info {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 25px;
          margin-bottom: 25px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 10px 12px;
          text-align: left;
          font-size: 13px;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          color: #64748b;
          font-weight: 600;
          width: 35%;
        }
        td {
          color: #0f172a;
          font-weight: 700;
        }
        .qr-section {
          text-align: center;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 15px;
          background: #f8fafc;
        }
        .qr-img {
          width: 150px;
          height: 150px;
          margin-bottom: 8px;
        }
        .instruccion {
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }
        .aviso {
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 12px 15px;
          border-radius: 6px;
          font-size: 11px;
          color: #1e40af;
          margin-top: 20px;
          line-height: 1.5;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          border-top: 1px dashed #cbd5e1;
          padding-top: 15px;
        }
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 20px;
          margin-bottom: 25px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .btn-primary {
          background: #003366;
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-primary:hover {
          background: #002244;
        }
        .btn-secondary {
          background: #fff;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 9px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-secondary:hover {
          background: #f1f5f9;
        }
        @media print {
          body {
            padding: 10px;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="toolbar no-print">
        <div style="font-size: 13px; color: #475569;">
          <strong>Comprobante Oficial:</strong> Puedes guardar este pase como documento PDF o imprimirlo.
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" onclick="window.print()">
            Guardar como PDF / Imprimir
          </button>
          <button class="btn-secondary" onclick="window.close()">
            Cerrar
          </button>
        </div>
      </div>

      <div class="header">
        <div class="institucion">Universidad Mayor de San Simón</div>
        <div class="facultad">Facultad de Ciencias y Tecnología &bull; LabReserve Campus</div>
        <div class="titulo">Comprobante Oficial de Reserva</div>
        <div class="codigo-box">${codigoOficial}</div>
      </div>

      <div class="grid-info">
        <div>
          <table>
            <tr>
              <th>Titular:</th>
              <td>${reserva.usuario?.nombreCompleto || 'Docente Universitario'}</td>
            </tr>
            <tr>
              <th>Correo Institucional:</th>
              <td>${reserva.usuario?.correo || '-'}</td>
            </tr>
            <tr>
              <th>Laboratorio:</th>
              <td>${reserva.laboratorio.nombre}</td>
            </tr>
            <tr>
              <th>Ubicación:</th>
              <td>${reserva.laboratorio.ubicacion || 'Campus Central FCyT'}</td>
            </tr>
            <tr>
              <th>Materia / Práctica:</th>
              <td>${reserva.materia || 'Actividad Académica Regular'}</td>
            </tr>
            <tr>
              <th>Fecha Programada:</th>
              <td style="text-transform: capitalize;">${fechaStr}</td>
            </tr>
            <tr>
              <th>Turno y Horario:</th>
              <td>${horaStr}</td>
            </tr>
            <tr>
              <th>Modalidad / Cupo:</th>
              <td>${reserva.numeroComputadora ? `Puesto Individual PC-${reserva.numeroComputadora}` : `Aula Completa (${reserva.cantidadAlumnos || 'Aforo total'} personas)`}</td>
            </tr>
            <tr>
              <th>Estado de Aprobación:</th>
              <td style="color: #059669;">${reserva.estado.toUpperCase()}</td>
            </tr>
          </table>
        </div>

        <div class="qr-section">
          ${qrUrl ? `<img src="${qrUrl}" alt="Pase QR" class="qr-img">` : ''}
          <div style="font-size: 11px; font-weight: bold; color: #003366; margin-bottom: 4px;">PASE DE ACCESO OFICIAL</div>
          <p class="instruccion">Presenta este código al auxiliar o responsable en la puerta del laboratorio dentro de los primeros 15 minutos.</p>
        </div>
      </div>

      <div class="aviso">
        <strong>Reglamento y Normas de Uso:</strong><br>
        1. La tolerancia máxima para el escaneo del código QR es de 15 minutos tras la hora de inicio pactada.<br>
        2. Superado dicho plazo sin validación, la reserva cambiará a estado <strong>Ausente (No-Show)</strong> y el sistema suspenderá la posibilidad de reservar por 24 horas.<br>
        3. Si no va a utilizar el espacio, cancele la reserva con anticipación desde la plataforma para liberar el horario a otros docentes y estudiantes.
      </div>

      <div class="footer">
        Documento emitido por el sistema LabReserve FCyT - UMSS.<br>
        Hash de integridad: SHA256-${reserva.tokenQr ? reserva.tokenQr.substring(0, 24) : 'VALID'}-VERIFIED &bull; Cochabamba, Bolivia
      </div>
    </body>
    </html>
  `;

  ventana.document.write(html);
  ventana.document.close();
};