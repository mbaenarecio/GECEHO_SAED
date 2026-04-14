-- ============================================================
-- 005_alumnos_cursos.sql
-- Cambios en alumnos (iniciales + apodo) y cursos escolares
-- ============================================================

-- 1. Añadir nuevas columnas a alumnos
ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS iniciales TEXT,
  ADD COLUMN IF NOT EXISTS apodo     TEXT;

-- 2. Los campos nombre/apellido1/apellido2 se mantienen para no romper
--    datos existentes, pero ya no se usarán en el formulario.
--    Si hubiera datos, los migramos a iniciales/apodo como referencia.
UPDATE alumnos
SET
  iniciales = UPPER(LEFT(COALESCE(nombre,''),1) || LEFT(COALESCE(apellido1,''),1) || LEFT(COALESCE(apellido2,''),1)),
  apodo     = nombre
WHERE iniciales IS NULL AND nombre IS NOT NULL;

-- 3. Añadir columnas de curso y etapa a cursos_escolares
ALTER TABLE cursos_escolares
  ADD COLUMN IF NOT EXISTS curso  TEXT,
  ADD COLUMN IF NOT EXISTS etapa  TEXT;

-- 4. Tabla de opciones fijas (no hace falta, se manejan en frontend)
--    Solo aseguramos que la tabla tiene los campos correctos.
