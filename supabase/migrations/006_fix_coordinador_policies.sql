-- PEGAR EN SUPABASE SQL EDITOR Y EJECUTAR
ALTER TABLE usuario_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coordinador_select_usuarios_centro"
ON usuarios FOR SELECT
USING (
  has_role('coordinador')
  AND centro_id = (
    SELECT centro_id FROM usuarios WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "coordinador_insert_docentes_centro"
ON usuarios FOR INSERT
WITH CHECK (
  has_role('coordinador')
  AND rol = 'docente'
  AND centro_id = (
    SELECT centro_id FROM usuarios WHERE auth_id = auth.uid()
  )
);

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

CREATE POLICY "coordinador_insert_roles_docente"
ON usuario_roles FOR INSERT
WITH CHECK (
  has_role('coordinador')
  AND rol = 'docente'
);
