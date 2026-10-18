-- =========================================================================
-- MIGRACIÓN MANUAL POSTGRESQL: MOTOR DE CONCURRENCIA HU-15
-- Previene colisiones simultáneas y solapamientos de reservas en milisegundos.
-- =========================================================================

-- 1. Habilitar extensión btree_gist para soportar tipos escalares en índices GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Limpiar restricciones si existen previamente
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_sin_solapamiento;
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_rango_valido;

-- 3. Restricción lógica: la fecha de fin debe ser estrictamente posterior a la de inicio
ALTER TABLE reservas
  ADD CONSTRAINT reservas_rango_valido
  CHECK (fecha_fin > fecha_inicio);

-- 4. Restricción de exclusión física: ningún laboratorio (o computadora específica)
--    puede tener dos reservas activas ('Pendiente', 'Aprobada', 'Confirmada')
--    cuyos rangos temporales [fecha_inicio, fecha_fin) se solapen (operador &&).
ALTER TABLE reservas
  ADD CONSTRAINT reservas_sin_solapamiento
  EXCLUDE USING gist (
    laboratorio_id WITH =,
    COALESCE(numero_computadora, 0) WITH =,
    tsrange(fecha_inicio, fecha_fin, '[)') WITH &&
  ) WHERE (estado IN ('Pendiente', 'Aprobada', 'Confirmada'));
