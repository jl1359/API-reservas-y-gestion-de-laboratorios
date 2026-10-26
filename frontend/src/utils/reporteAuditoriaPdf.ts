import type { ReporteData } from '../hooks/useReporteAsistenciasCalculos';

export interface FiltrosAuditoriaPdf {
  modoAuditoria: 'dia' | 'rango';
  fecha: string;
  fechaInicio: string;
  fechaFin: string;
  carreraNombre?: string;
  laboratorioNombre?: string;
}

export const imprimirReporteAuditoriaPdf = (
  reporte: ReporteData | null,
  filtros: FiltrosAuditoriaPdf
) => {
  const ventana = window.open('', '_blank', 'width=1000,height=850');
  if (!ventana) return;

  const hoyStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const periodoStr = filtros.modoAuditoria === 'dia'
    ? `Día: ${filtros.fecha}`
    : `Rango: Del ${filtros.fechaInicio} al ${filtros.fechaFin}`;

  const total = reporte?.resumen?.totalReservas ?? reporte?.reservas?.length ?? 0;
  const asistencias = reporte?.resumen?.asistenciasRegistradas ?? 0;
  const inasistencias = reporte?.resumen?.inasistenciasRegistradas ?? 0;
  const tasaAsistencia = total > 0 ? Math.round((asistencias / total) * 100) : 0;
  const codigoDoc = `AUD-FCYT-${Date.now().toString().slice(-6)}`;

  const reservas = reporte?.reservas || [];

  const filasTabla = reservas.length > 0
    ? reservas.map((r, i) => {
        const fInicio = new Date(r.fechaInicio);
        const fFin = new Date(r.fechaFin);
        const fStr = fInicio.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hStr = `${fInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${fFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        const usuarioNombre = r.usuario?.nombreCompleto || 'Usuario Estudiante';
        const usuarioCi = r.usuario?.ci || '-';
        const labNombre = r.laboratorio?.nombre || 'Laboratorio FCyT';
        const materiaMotivo = r.materia || r.motivo || 'Práctica / Estudio Regular';
        const pcStr = r.numeroComputadora ? `PC #${r.numeroComputadora}` : 'Completo';
        const asistenciaEstado = r.horaAsistencia
          ? `<span class="badge badge-success">Presente (${new Date(r.horaAsistencia).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})</span>`
          : (r.estado === 'Completada'
              ? '<span class="badge badge-danger">Ausente</span>'
              : `<span class="badge badge-warning">${r.estado}</span>`);

        return `
          <tr>
            <td style="text-align: center; color: #64748b;">${i + 1}</td>
            <td><strong>${fStr}</strong><br><small style="color:#64748b;">${hStr}</small></td>
            <td>${labNombre}</td>
            <td><strong>${usuarioNombre}</strong></td>
            <td style="text-align: center;">${usuarioCi}</td>
            <td>${materiaMotivo}</td>
            <td style="text-align: center;">${pcStr}</td>
            <td style="text-align: center;">${asistenciaEstado}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">No se encontraron registros de auditoría para los filtros aplicados.</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Reporte Oficial de Auditoría y Asistencias · FCyT UMSS</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #0f172a;
          background: #f8fafc;
          margin: 0;
          padding: 24px;
        }
        .toolbar {
          position: sticky;
          top: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          z-index: 100;
        }
        .toolbar-info {
          font-size: 13px;
          color: #475569;
        }
        .toolbar-info strong {
          color: #002855;
        }
        .btn-primary {
          background: #002855;
          color: white;
          border: none;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-primary:hover { background: #001f42; }
        .btn-secondary {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-secondary:hover { background: #e2e8f0; }
        .documento {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px 36px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          max-width: 950px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #002855;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .institucion {
          font-size: 17px;
          font-weight: 800;
          color: #002855;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .facultad {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-top: 2px;
        }
        .titulo {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 10px;
          text-transform: uppercase;
        }
        .subtitulo {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .meta-box {
          display: flex;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 12px;
          margin-bottom: 20px;
        }
        .kpis-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .kpi-card {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }
        .kpi-num {
          font-size: 22px;
          font-weight: 800;
          color: #002855;
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 28px;
        }
        th {
          background: #002855;
          color: #ffffff;
          font-weight: 600;
          padding: 9px 8px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 700;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .firmas {
          display: flex;
          justify-content: space-around;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-size: 12px;
          color: #475569;
        }
        .linea-firma {
          width: 200px;
          border-top: 1px solid #475569;
          margin-bottom: 6px;
        }
        .footer-seal {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
        }
        @media print {
          body { background: #fff; padding: 0; }
          .toolbar { display: none !important; }
          .documento { border: none; box-shadow: none; padding: 12px; max-width: 100%; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar no-print">
        <div class="toolbar-info">
          <strong>Vista Previa del Reporte Oficial:</strong> Puedes guardarlo como documento PDF o imprimirlo.
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-primary" onclick="window.print()">Guardar como PDF / Imprimir</button>
          <button class="btn-secondary" onclick="window.close()">Cerrar</button>
        </div>
      </div>

      <div class="documento">
        <div class="header">
          <div class="institucion">Universidad Mayor de San Simón</div>
          <div class="facultad">Facultad de Ciencias y Tecnología &bull; LabReserve Campus</div>
          <div class="titulo">Informe Oficial de Auditoría y Asistencias</div>
          <div class="subtitulo">Registro institucional de control de ocupación, asistencia y trazabilidad</div>
        </div>

        <div class="meta-box">
          <div><strong>Período Evaluado:</strong> ${periodoStr}</div>
          <div><strong>Carrera:</strong> ${filtros.carreraNombre || 'Todas las Carreras'}</div>
          <div><strong>Laboratorio:</strong> ${filtros.laboratorioNombre || 'Todos los Laboratorios'}</div>
          <div><strong>Emisión:</strong> ${hoyStr}</div>
        </div>

        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-num">${total}</div>
            <div class="kpi-label">Reservas Programadas</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #15803d;">${asistencias}</div>
            <div class="kpi-label">Asistencias Confirmadas</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #b91c1c;">${inasistencias}</div>
            <div class="kpi-label">Inasistencias Registradas</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num" style="color: #0284c7;">${tasaAsistencia}%</div>
            <div class="kpi-label">Tasa de Asistencia</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="width: 120px;">Fecha y Horario</th>
              <th>Laboratorio</th>
              <th>Usuario Solicitante</th>
              <th style="text-align: center; width: 80px;">C.I.</th>
              <th>Materia / Práctica</th>
              <th style="text-align: center; width: 60px;">Espacio</th>
              <th style="text-align: center; width: 100px;">Asistencia</th>
            </tr>
          </thead>
          <tbody>
            ${filasTabla}
          </tbody>
        </table>

        <div class="firmas">
          <div>
            <div class="linea-firma"></div>
            <strong>Responsable de Laboratorio</strong><br>
            <span>Verificación y Auditoría FCyT</span>
          </div>
          <div>
            <div class="linea-firma"></div>
            <strong>Dirección Académica / Decanato</strong><br>
            <span>Facultad de Ciencias y Tecnología</span>
          </div>
        </div>

        <div class="footer-seal">
          Código de Documento: ${codigoDoc} &bull; Documento generado automáticamente por LabReserve FCyT &bull; Validez Institucional UMSS
        </div>
      </div>
    </body>
    </html>
  `;

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
};