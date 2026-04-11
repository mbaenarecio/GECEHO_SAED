# GECEHO - Gestión de Centros y Horarios

## Instalación

```bash
npm install
npm run dev
```

## Configuración Supabase

Las credenciales ya están configuradas en `.env.local`.

## Configurar base de datos

1. Ve a https://supabase.com/dashboard/project/yqqequygfncwigaxihpl/sql
2. Ejecuta `supabase/migrations/001_initial_schema.sql`
3. Ejecuta `supabase/migrations/002_rls_policies.sql`
4. Crea el usuario admin en Authentication > Users con:
   - Email: mbaenarecio@educa.madrid.org
   - Password: Arcalaus_24_04
5. Copia el UUID generado y edita `003_admin_user.sql`
6. Ejecuta `supabase/migrations/003_admin_user.sql`

## Roles
- **admin**: acceso total
- **gestor**: gestión de centros y usuarios
- **coordinador**: gestión de cursos, docentes, alumnos
- **asesor**: visualización de alumnos y registros
- **docente**: registro diario propio
