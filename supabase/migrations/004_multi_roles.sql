-- ============================================================
-- 004_multi_roles.sql
-- Soporte de roles múltiples por usuario + fix primer_acceso
-- ============================================================

-- 1. Añadir columnas a usuarios si no existen
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS nombre       TEXT,
  ADD COLUMN IF NOT EXISTS apellido1    TEXT,
  ADD COLUMN IF NOT EXISTS apellido2    TEXT,
  ADD COLUMN IF NOT EXISTS primer_acceso BOOLEAN NOT NULL DEFAULT true;

-- Rellenar nombre/apellido1 desde nombre_completo para filas existentes
UPDATE usuarios
SET
  nombre    = split_part(nombre_completo, ' ', 1),
  apellido1 = split_part(nombre_completo, ' ', 2)
WHERE nombre IS NULL AND nombre_completo IS NOT NULL;

-- 2. Tabla de roles múltiples
CREATE TABLE IF NOT EXISTS usuario_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol         user_role NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, rol)
);

-- 3. Poblar usuario_roles con el rol actual de cada usuario (migración datos)
INSERT INTO usuario_roles (usuario_id, rol)
SELECT id, rol FROM usuarios
ON CONFLICT DO NOTHING;

-- 4. Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario_id ON usuario_roles(usuario_id);

-- 5. Función helper: obtener array de roles del usuario autenticado
CREATE OR REPLACE FUNCTION get_my_roles()
RETURNS user_role[] AS $$
  SELECT array_agg(rol) FROM usuario_roles WHERE usuario_id = (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Función helper: comprobar si el usuario tiene un rol concreto
CREATE OR REPLACE FUNCTION has_role(p_rol user_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuario_roles ur
    JOIN usuarios u ON u.id = ur.usuario_id
    WHERE u.auth_id = auth.uid() AND ur.rol = p_rol
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. RLS para usuario_roles
ALTER TABLE usuario_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin puede gestionar todos los roles"
  ON usuario_roles FOR ALL
  USING (has_role('admin'));

CREATE POLICY "usuarios ven sus propios roles"
  ON usuario_roles FOR SELECT
  USING (
    usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid())
  );

-- 8. Función crear_usuario actualizada (incluye primer_acceso)
CREATE OR REPLACE FUNCTION crear_usuario(
  p_email        TEXT,
  p_password     TEXT,
  p_nombre       TEXT,
  p_apellido1    TEXT,
  p_apellido2    TEXT DEFAULT NULL,
  p_nombre_usuario TEXT DEFAULT NULL,
  p_rol          user_role DEFAULT 'docente',
  p_centro_id    UUID DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_auth_id UUID;
  v_user_id UUID;
BEGIN
  -- Crear usuario en auth
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NULL,  -- email NO confirmado → forzará verificación
    '{"provider":"email","providers":["email"]}',
    json_build_object('nombre', p_nombre, 'apellido1', p_apellido1),
    now(), now()
  )
  RETURNING id INTO v_auth_id;

  -- Crear perfil en usuarios
  INSERT INTO usuarios (
    auth_id, email, nombre, apellido1, apellido2,
    nombre_completo, nombre_usuario, rol, centro_id,
    activo, primer_acceso
  )
  VALUES (
    v_auth_id, p_email, p_nombre, p_apellido1, p_apellido2,
    trim(p_nombre || ' ' || p_apellido1), p_nombre_usuario,
    p_rol, p_centro_id, true, true
  )
  RETURNING id INTO v_user_id;

  -- Insertar rol en usuario_roles
  INSERT INTO usuario_roles (usuario_id, rol) VALUES (v_user_id, p_rol);

  RETURN json_build_object('user_id', v_user_id, 'auth_id', v_auth_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
