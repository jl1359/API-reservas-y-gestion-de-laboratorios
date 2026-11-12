-- AlterTable: usuarios (CI y foto de perfil)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ci" VARCHAR(20);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "foto_url" TEXT;

-- AlterTable: solicitudes_rol (motivo)
ALTER TABLE "solicitudes_rol" ADD COLUMN IF NOT EXISTS "motivo" TEXT;

-- AlterTable: laboratorios (geolocalizacion y soporte de imagen Base64)
ALTER TABLE "laboratorios" ADD COLUMN IF NOT EXISTS "latitud" DOUBLE PRECISION;
ALTER TABLE "laboratorios" ADD COLUMN IF NOT EXISTS "longitud" DOUBLE PRECISION;
ALTER TABLE "laboratorios" ALTER COLUMN "imagen_url" TYPE TEXT;

-- AlterTable: reservas (anulacion sin borrar cuenta + control de recordatorio por correo)
ALTER TABLE "reservas" ALTER COLUMN "usuario_id" DROP NOT NULL;
ALTER TABLE "reservas" ADD COLUMN IF NOT EXISTS "recordatorio_enviado" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reservas_usuario_id_fkey' AND table_name = 'reservas'
  ) THEN
    ALTER TABLE "reservas" DROP CONSTRAINT "reservas_usuario_id_fkey";
  END IF;
END $$;

ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: sanciones
CREATE TABLE IF NOT EXISTS "sanciones" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "reserva_id" INTEGER,
    "motivo" VARCHAR(255) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'Activa',

    CONSTRAINT "sanciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable: feriados
CREATE TABLE IF NOT EXISTS "feriados" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "motivo" VARCHAR(150) NOT NULL,
    "bloqueo_activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "feriados_pkey" PRIMARY KEY ("id")
);

-- CreateTable: dispositivos_notificacion (Web Push VAPID)
CREATE TABLE IF NOT EXISTS "dispositivos_notificacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivos_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "dispositivos_notificacion_endpoint_key" ON "dispositivos_notificacion"("endpoint");
CREATE INDEX IF NOT EXISTS "dispositivos_notificacion_usuario_id_idx" ON "dispositivos_notificacion"("usuario_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sanciones_usuario_id_fkey' AND table_name = 'sanciones'
  ) THEN
    ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sanciones_reserva_id_fkey' AND table_name = 'sanciones'
  ) THEN
    ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_reserva_id_fkey"
      FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'dispositivos_notificacion_usuario_id_fkey' AND table_name = 'dispositivos_notificacion'
  ) THEN
    ALTER TABLE "dispositivos_notificacion" ADD CONSTRAINT "dispositivos_notificacion_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
