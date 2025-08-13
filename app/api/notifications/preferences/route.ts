// ==============================================
// API ENDPOINT: GESTIÓN DE PREFERENCIAS DE NOTIFICACIÓN
// Maneja las preferencias de notificación push del usuario
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'UserId requerido' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Obteniendo preferencias de notificación para usuario:', userId);

    // Obtener preferencias del usuario
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error obteniendo preferencias:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo preferencias' 
        },
        { status: 500 }
      );
    }

    // Si no existen preferencias, crear las por defecto
    if (!preferences) {
      console.log('📝 Creando preferencias por defecto...');
      
      const { data: defaultPrefs, error: createError } = await supabase
        .rpc('create_default_notification_preferences', { 
          user_id_param: userId 
        });

      if (createError) {
        console.error('❌ Error creando preferencias por defecto:', createError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error creando preferencias por defecto' 
          },
          { status: 500 }
        );
      }

      // Obtener las preferencias recién creadas
      const { data: newPreferences, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Error obteniendo preferencias creadas:', fetchError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error obteniendo preferencias' 
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        preferences: newPreferences,
        isDefault: true
      });
    }

    console.log('✅ Preferencias obtenidas exitosamente');

    return NextResponse.json({
      success: true,
      preferences: preferences,
      isDefault: false
    });

  } catch (error) {
    console.error('❌ Error en API Get Preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'UserId requerido' 
        },
        { status: 400 }
      );
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Preferencias requeridas' 
        },
        { status: 400 }
      );
    }

    console.log('🔧 Actualizando preferencias para usuario:', userId);

    // Preparar datos de actualización
    const updateData = {
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    };

    // Actualizar preferencias
    const { data: updatedPreferences, error } = await supabase
      .from('notification_preferences')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando preferencias:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error actualizando preferencias' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Preferencias actualizadas exitosamente');

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
      message: 'Preferencias actualizadas exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en API Update Preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'UserId requerido' 
        },
        { status: 400 }
      );
    }

    console.log('📝 Creando preferencias por defecto para usuario:', userId);

    // Crear preferencias por defecto usando la función de base de datos
    const { error } = await supabase
      .rpc('create_default_notification_preferences', { 
        user_id_param: userId 
      });

    if (error) {
      console.error('❌ Error creando preferencias por defecto:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error creando preferencias por defecto' 
        },
        { status: 500 }
      );
    }

    // Obtener las preferencias recién creadas
    const { data: preferences, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Error obteniendo preferencias creadas:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo preferencias' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Preferencias por defecto creadas exitosamente');

    return NextResponse.json({
      success: true,
      preferences: preferences,
      message: 'Preferencias por defecto creadas exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en API Create Default Preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
