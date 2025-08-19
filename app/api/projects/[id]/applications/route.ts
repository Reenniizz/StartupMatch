import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { secureAuthService } from '@/lib/auth-security';
import { rateLimit } from '@/lib/rate-limiting';
import { inputValidationService } from '@/lib/input-validation';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const IdParamSchema = z.object({ id: z.string().min(1) });
const ApplySchema = z.object({
  desired_role: z.string().min(1),
  message: z.string().min(1),
  proposed_equity: z.number().optional(),
  proposed_commitment: z.string().optional(),
  resume_url: z.string().url().optional(),
  portfolio_url: z.string().url().optional(),
  cover_letter_url: z.string().url().optional(),
  additional_documents: z.array(z.string()).optional()
});

// GET /api/projects/[id]/applications - Obtener aplicaciones del proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_project_apps_get', 200, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    // Validar params
    const validation = inputValidationService.validate(params, IdParamSchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    // Verificar permisos (creador o admin del proyecto)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', validation.sanitizedData.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: getAPISecurityHeaders() });
    }

    const isCreator = project.creator_id === session.user.id;
    
    let isAdmin = false;
    if (!isCreator) {
      const { data: teamMember } = await supabase
        .from('project_team_members')
        .select('is_admin')
        .eq('project_id', validation.sanitizedData.id)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();
      
      isAdmin = teamMember?.is_admin || false;
    }

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403, headers: getAPISecurityHeaders() });
    }

    // Obtener aplicaciones con información del aplicante
    const { data: applications, error } = await supabase
      .from('project_applications')
      .select(`
        *,
        applicant:user_profiles!applicant_id(
          user_id,
          first_name,
          last_name,
          avatar_url,
          role,
          company,
          headline,
          bio,
          linkedin_url,
          github_url,
          portfolio_url
        )
      `)
      .eq('project_id', validation.sanitizedData.id)
      .order('applied_at', { ascending: false });

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error fetching applications', { source: 'project_apps', error: error.message, ip: clientIP });
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    return NextResponse.json({ applications }, { headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error project apps GET', { source: 'project_apps', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}

// POST /api/projects/[id]/applications - Aplicar al proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit.checkLimit(clientIP, 'api_project_apps_post', 50, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
    }

    const supabase = await createSupabaseServer();

    // Autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: getAPISecurityHeaders() });
    }

    // Validar params
    const idValidation = inputValidationService.validate(params, IdParamSchema);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    // Validar body
    const body = await request.json();
    const validation = inputValidationService.validate(body, ApplySchema);
    if (!validation.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    // Verificar que el proyecto acepta aplicaciones
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('accepts_applications, status, application_deadline, creator_id')
      .eq('id', idValidation.sanitizedData.id)
      .single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: getAPISecurityHeaders() });
    }

    if (project.creator_id === session.user.id) {
      return NextResponse.json({ error: 'Cannot apply to your own project' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    if (!project.accepts_applications) {
      return NextResponse.json({ error: 'This project is not accepting applications' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    if (project.status !== 'active') {
      return NextResponse.json({ error: 'Cannot apply to inactive project' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    if (project.application_deadline && new Date(project.application_deadline) < new Date()) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    // Verificar si ya es miembro del equipo
    const { data: teamMember } = await supabase
      .from('project_team_members')
      .select('id')
      .eq('project_id', idValidation.sanitizedData.id)
      .eq('user_id', session.user.id)
      .single();

    if (teamMember) {
      return NextResponse.json({ error: 'You are already a member of this project' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    // Verificar si ya aplicó
    const { data: existingApplication } = await supabase
      .from('project_applications')
      .select('id')
      .eq('project_id', idValidation.sanitizedData.id)
      .eq('applicant_id', session.user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this project' }, { status: 400, headers: getAPISecurityHeaders() });
    }

    // Crear la aplicación
    const applicationData = {
      project_id: idValidation.sanitizedData.id,
      applicant_id: session.user.id,
      desired_role: validation.sanitizedData.desired_role,
      message: validation.sanitizedData.message,
      proposed_equity: validation.sanitizedData.proposed_equity || null,
      proposed_commitment: validation.sanitizedData.proposed_commitment || 'part_time',
      resume_url: validation.sanitizedData.resume_url || null,
      portfolio_url: validation.sanitizedData.portfolio_url || null,
      cover_letter_url: validation.sanitizedData.cover_letter_url || null,
      additional_documents: validation.sanitizedData.additional_documents || []
    };

    const { data: application, error } = await supabase
      .from('project_applications')
      .insert(applicationData)
      .select(`
        *,
        applicant:user_profiles!applicant_id(
          user_id,
          first_name,
          last_name,
          avatar_url,
          role,
          company
        )
      `)
      .single();

    if (error) {
      logSecurityEvent('system', 'medium', 'DB error creating application', { source: 'project_apps', error: error.message, ip: clientIP });
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500, headers: getAPISecurityHeaders() });
    }

    return NextResponse.json({ application }, { status: 201, headers: getAPISecurityHeaders() });

  } catch (error) {
    logSecurityEvent('system', 'medium', 'Unexpected error project apps POST', { source: 'project_apps', error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: getAPISecurityHeaders() });
  }
}
