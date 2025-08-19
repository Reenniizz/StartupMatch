import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { secureAuthService } from '@/lib/auth-security';
import { inputValidationService } from '@/lib/input-validation';
import { rateLimit } from '@/lib/rate-limiting';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const DeliveredPostSchema = z.object({
	messageIds: z.array(z.union([z.number(), z.string()])).min(1, 'IDs requeridos')
});

const DeliveredGetSchema = z.object({
	conversationId: z.string().min(1, 'ID de conversación requerido')
});

/**
 * Mark messages as delivered
 */
export async function POST(request: NextRequest) {
	try {
		const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
		const rl = await rateLimit.checkLimit(clientIP, 'api_messages_mark_delivered_post', 200, 60000);
		if (!rl.allowed) {
			logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on mark-delivered POST', { source: 'messages_mark_delivered', ip: clientIP });
			return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
		}

		const supabase = await createSupabaseServer();

		// Auth
		const auth = await secureAuthService.verifyAuth(request);
		if (!auth.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
		}
		const userId = auth.user.id;

		// Validar body
		const body = await request.json();
		const validation = inputValidationService.validate(body, DeliveredPostSchema);
		if (!validation.success) {
			logSecurityEvent('threat', 'medium', 'Invalid input for mark-delivered', { source: 'messages_mark_delivered', errors: validation.errors, ip: clientIP, userId });
			return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
		}
		const { messageIds } = validation.sanitizedData;

		const { data: updatedMessages, error: updateError } = await supabase
			.from('private_messages')
			.update({ delivered_at: new Date().toISOString() })
			.in('id', messageIds)
			.neq('sender_id', userId)
			.is('delivered_at', null)
			.select('id, conversation_id');

		if (updateError) {
			logSecurityEvent('system', 'medium', 'DB error mark-delivered', { source: 'messages_mark_delivered', error: updateError.message, ip: clientIP, userId });
			return NextResponse.json({ error: 'Error marcando mensajes' }, { status: 500, headers: getAPISecurityHeaders() });
		}

		logSecurityEvent('system', 'low', 'Messages marked as delivered', { source: 'messages_mark_delivered', count: updatedMessages?.length || 0, userId, ip: clientIP });

		return NextResponse.json({
			success: true,
			delivered: updatedMessages?.length || 0,
			messageIds: updatedMessages?.map(m => m.id) || []
		}, { headers: getAPISecurityHeaders() });

	} catch (error) {
		logSecurityEvent('system', 'medium', 'Unexpected error mark-delivered POST', { source: 'messages_mark_delivered', error: error instanceof Error ? error.message : 'unknown' });
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
	}
}

/**
 * Get delivery status for messages
 */
export async function GET(request: NextRequest) {
	try {
		const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
		const rl = await rateLimit.checkLimit(clientIP, 'api_messages_mark_delivered_get', 300, 60000);
		if (!rl.allowed) {
			logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on mark-delivered GET', { source: 'messages_mark_delivered', ip: clientIP });
			return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
		}

		const supabase = await createSupabaseServer();

		// Auth
		const auth = await secureAuthService.verifyAuth(request);
		if (!auth.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
		}
		const userId = auth.user.id;

		// Validar query
		const { searchParams } = new URL(request.url);
		const queryData = { conversationId: searchParams.get('conversationId') };
		const validation = inputValidationService.validate(queryData, DeliveredGetSchema);
		if (!validation.success) {
			return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
		}
		const { conversationId } = validation.sanitizedData;

		const { data: stats, error: statsError } = await supabase
			.from('private_messages')
			.select('id, delivered_at, read_at')
			.eq('conversation_id', conversationId)
			.eq('sender_id', userId);

		if (statsError) {
			logSecurityEvent('system', 'medium', 'DB error getting delivery stats', { source: 'messages_mark_delivered', error: statsError.message, ip: clientIP, userId });
			return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500, headers: getAPISecurityHeaders() });
		}

		const deliveryStats = {
			total: stats?.length || 0,
			delivered: stats?.filter(m => m.delivered_at).length || 0,
			read: stats?.filter(m => m.read_at).length || 0,
			pending: stats?.filter(m => !m.delivered_at).length || 0
		};

		return NextResponse.json(deliveryStats, { headers: getAPISecurityHeaders() });

	} catch (error) {
		logSecurityEvent('system', 'medium', 'Unexpected error mark-delivered GET', { source: 'messages_mark_delivered', error: error instanceof Error ? error.message : 'unknown' });
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
	}
}
