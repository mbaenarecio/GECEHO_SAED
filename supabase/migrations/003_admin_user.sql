-- PASO 1: Ve a Authentication > Users en Supabase Dashboard
-- PASO 2: Crea usuario con email: mbaenarecio@educa.madrid.org y contraseña: Arcalaus_24_04
-- PASO 3: Copia el UUID del usuario creado
-- PASO 4: Reemplaza 'PEGA_AQUI_EL_UUID' y ejecuta en SQL Editor

INSERT INTO usuarios (auth_id, nombre_completo, email, nombre_usuario, rol, activo, primer_acceso)
VALUES (
  'PEGA_AQUI_EL_UUID',
  'Administrador GECEHO',
  'mbaenarecio@educa.madrid.org',
  'mbaenarecio',
  'admin',
  true,
  false
)
ON CONFLICT (email) DO UPDATE SET rol='admin', activo=true, primer_acceso=false;