import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { secureAuthService } from '@/lib/auth-security';
import { inputValidationService } from '@/lib/input-validation';
import { rateLimit } from '@/lib/rate-limiting';
import { logSecurityEvent } from '@/lib/security-monitoring';
import { getAPISecurityHeaders } from '@/lib/security-headers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MarkReadPostSchema = z.object({
	conversationId: z.string().min(1).optional(),
	messageIds: z.array(z.union([z.number(), z.string()])).optional()
}).refine((d) => !!d.conversationId || (d.messageIds && d.messageIds.length > 0), {
	message: 'ID de conversación o IDs de mensajes requeridos'
});

const MarkReadGetSchema = z.object({
	conversationId: z.string().optional(),
	messageId: z.string().optional()
}).refine((d) => !!d.conversationId || !!d.messageId, {
	message: 'ID de conversación o mensaje requerido'
});

/**
 * Mark messages as read
 * Used when user opens/views messages in a conversation
 */
export async function POST(request: NextRequest) {
	try {
		const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
		const rl = await rateLimit.checkLimit(clientIP, 'api_messages_mark_read_post', 200, 60000);
		if (!rl.allowed) {
			logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on mark-read POST', { source: 'messages_mark_read', ip: clientIP });
			return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
		}

		const supabase = await createSupabaseServer();

		// Auth
		const auth = await secureAuthService.verifyAuth(request);
		if (!auth.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
		}
		const userId = auth.user.id;

		// Validate body
		const body = await request.json();
		const validation = inputValidationService.validate(body, MarkReadPostSchema);
		if (!validation.success) {
			logSecurityEvent('threat', 'medium', 'Invalid input for mark-read', { source: 'messages_mark_read', errors: validation.errors, ip: clientIP, userId });
			return NextResponse.json({ error: 'Datos inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
		}
		const { conversationId, messageIds } = validation.sanitizedData;

		let query = supabase
			.from('private_messages')
			.update({ read_at: new Date().toISOString() })
			.neq('sender_id', userId)
			.is('read_at', null);

		if (messageIds && messageIds.length > 0) {
			query = query.in('id', messageIds);
		} else if (conversationId) {
			query = query.eq('conversation_id', conversationId);
		}

		const { data: updatedMessages, error: updateError } = await query.select('id, conversation_id, sender_id');
		if (updateError) {
			logSecurityEvent('system', 'medium', 'DB error mark-read', { source: 'messages_mark_read', error: updateError.message, ip: clientIP, userId });
			return NextResponse.json({ error: 'Error marcando mensajes' }, { status: 500, headers: getAPISecurityHeaders() });
		}

		const readCount = updatedMessages?.length || 0;
		logSecurityEvent('system', 'low', 'Messages marked as read', { source: 'messages_mark_read', count: readCount, userId, ip: clientIP });

		return NextResponse.json({
			success: true,
			read: readCount,
			messageIds: updatedMessages?.map(m => m.id) || [],
			conversationId
		}, { headers: getAPISecurityHeaders() });

	} catch (error) {
		logSecurityEvent('system', 'medium', 'Unexpected error mark-read POST', { source: 'messages_mark_read', error: error instanceof Error ? error.message : 'unknown' });
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
	}
}

/**
 * Get read status for messages
 */
export async function GET(request: NextRequest) {
	try {
		const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
		const rl = await rateLimit.checkLimit(clientIP, 'api_messages_mark_read_get', 300, 60000);
		if (!rl.allowed) {
			logSecurityEvent('rate_limit', 'medium', 'Rate limit exceeded on mark-read GET', { source: 'messages_mark_read', ip: clientIP });
			return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429, headers: { ...getAPISecurityHeaders(), 'Retry-After': String(rl.retryAfter || 60) } });
		}

		const supabase = await createSupabaseServer();

		// Auth
		const auth = await secureAuthService.verifyAuth(request);
		if (!auth.user) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers: getAPISecurityHeaders() });
		}
		const userId = auth.user.id;

		// Validate query
		const { searchParams } = new URL(request.url);
		const queryData = { conversationId: searchParams.get('conversationId'), messageId: searchParams.get('messageId') };
		const validation = inputValidationService.validate(queryData, MarkReadGetSchema);
		if (!validation.success) {
			return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400, headers: getAPISecurityHeaders() });
		}
		const { conversationId, messageId } = validation.sanitizedData;

		let query = supabase
			.from('private_messages')
			.select('id, delivered_at, read_at, sender_id, created_at');

		if (messageId) {
			query = query.eq('id', messageId);
		} else if (conversationId) {
			query = query.eq('conversation_id', conversationId);
		}

		const { data: messages, error: queryError } = await query;
		if (queryError) {
			logSecurityEvent('system', 'medium', 'DB error getting read status', { source: 'messages_mark_read', error: queryError.message, ip: clientIP, userId });
			return NextResponse.json({ error: 'Error obteniendo estado de lectura' }, { status: 500, headers: getAPISecurityHeaders() });
		}

		const readStats = {
			total: messages?.length || 0,
			sent: messages?.filter(m => m.sender_id === userId).length || 0,
			received: messages?.filter(m => m.sender_id !== userId).length || 0,
			delivered: messages?.filter(m => m.delivered_at && m.sender_id === userId).length || 0,
			read: messages?.filter(m => m.read_at && m.sender_id === userId).length || 0,
			unread: messages?.filter(m => !m.read_at && m.sender_id !== userId).length || 0
		};

		return NextResponse.json({
			stats: readStats,
			messages: messages?.map(m => ({
				id: m.id,
				status: m.sender_id === userId ? (m.read_at ? 'read' : m.delivered_at ? 'delivered' : 'sent') : (m.read_at ? 'read' : 'unread'),
				delivered_at: m.delivered_at,
				read_at: m.read_at,
				created_at: m.created_at,
				is_own: m.sender_id === userId
			}))
		}, { headers: getAPISecurityHeaders() });

	} catch (error) {
		logSecurityEvent('system', 'medium', 'Unexpected error mark-read GET', { source: 'messages_mark_read', error: error instanceof Error ? error.message : 'unknown' });
		return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: getAPISecurityHeaders() });
	}
}
