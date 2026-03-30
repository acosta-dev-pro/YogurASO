/**
 * Función de Supabase para eliminar la propia cuenta y activar o bloquear cuentas.
 * Requiere sesión y comprueba si quien llama es administrador.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { message: 'Método no permitido' });

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth?.user) return json(401, { message: 'Tu sesión venció. Inicia sesión de nuevo.' });
    const me = auth.user;

    const { data: perfil } = await admin.from('profiles').select('role,is_active').eq('id', me.id).maybeSingle();
    const soyAdmin = perfil?.role === 'admin' && perfil?.is_active === true;

    const body = await req.json().catch(() => ({}));

    if (body.action === 'delete_self') {
      // Un admin no se elimina desde la web: así nunca se queda la tienda sin administrador por accidente.
      if (soyAdmin) return json(403, { message: 'Una cuenta de administrador no se puede eliminar desde aquí.' });
      const { error } = await admin.auth.admin.deleteUser(me.id);
      if (error) return json(500, { message: 'No se pudo eliminar la cuenta. Intenta de nuevo.' });
      return json(200, { success: true });
    }

    if (body.action === 'set_active') {
      if (!soyAdmin) return json(403, { message: 'Solo un administrador puede hacer esto.' });
      const id = String(body.user_id ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { message: 'Usuario no válido.' });
      if (id === me.id) return json(400, { message: 'No puedes bloquear tu propia cuenta.' });
      const active = body.active === true;

      const { error: dbError } = await admin.from('profiles').update({ is_active: active }).eq('id', id);
      if (dbError) return json(500, { message: 'No se pudo actualizar el perfil.' });
      // 876000 h ≈ 100 años: bloqueo "permanente" que se quita con 'none'.
      const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: active ? 'none' : '876000h' });
      if (banError) return json(500, { message: 'El perfil se actualizó, pero no se pudo bloquear en Auth.' });
      return json(200, { success: true, active });
    }

    return json(400, { message: 'Acción no válida.' });
  } catch (_e) {
    return json(500, { message: 'Error inesperado.' });
  }
});
