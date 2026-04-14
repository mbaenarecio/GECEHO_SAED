-- ============================================================
-- 006_rls_coordinador.sql
-- Políticas RLS para coordinador
-- ============================================================

-- Eliminar primero por si ya existen (evita errores)
DROP POLICY IF EXISTS "coordinador_select_usuarios_centro" ON usuarios;
DROP POLICY IF EXISTS "coordinador_insert_docentes_centro" ON usuarios;
DROP POLICY IF EXISTS "coordinador_update_docentes_centro" ON usuarios;
DROP POLICY IF EXISTS "coordinador_insert_roles_docente" ON usuario_roles;

-- Política: coordinador puede VER usuarios de su centro
CREATE POLICY "coordinador_select_usuarios_centro"
ON usuarios FOR SELECT
USING (
  has_role('coordinador')
  AND centro_id = (
    SELECT centro_id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Política: coordinador puede CREAR docentes en su centro
CREATE POLICY "coordinador_insert_docentes_centro"
ON usuarios FOR INSERT
WITH CHECK (
  has_role('coordinador')
  AND rol = 'docente'
  AND centro_id = (
    SELECT centro_id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Política: coordinador puede EDITAR docentes de su centro
CREATE POLICY "coordinador_update_docentes_centro"
ON usuarios FOR UPDATE
USING (
  has_role('coordinador')
  AND centro_id = (
    SELECT centro_id FROM usuarios WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  rol = 'docente'
  AND centro_id = (
    SELECT centro_id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Política: coordinador puede asignar rol docente en usuario_roles
CREATE POLICY "coordinador_insert_roles_docente"
ON usuario_roles FOR INSERT
WITH CHECK (
  has_role('coordinador')
  AND rol = 'docente'
);
