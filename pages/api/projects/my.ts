import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from headers or cookies
    const authorization = req.headers.authorization;
    const sessionToken = req.headers['x-supabase-auth-token'] || req.cookies['sb-access-token'];
    
    // For now, we'll use a simple approach - get user from Authorization header
    // In a production app, you'd want to verify the JWT properly
    let userId: string | null = null;

    // Try to extract user ID from session
    if (authorization?.startsWith('Bearer ')) {
      try {
        // This is a simplified approach - in production you should decode and verify the JWT
        const token = authorization.replace('Bearer ', '');
        // For now, we'll try to get user from supabase auth
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        console.log('Error getting user from token:', error);
      }
    }

    // If no user found from token, try alternative approach
    if (!userId) {
      // Try to get from query parameter as fallback for development
      userId = req.query.userId as string;
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized - could not identify user',
          details: 'Please ensure you are logged in or provide userId parameter'
        });
      }
    }

    const tab = req.query.tab as string || 'created';
    
    // Build query based on tab
    let query = supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' });

    switch (tab) {
      case 'created':
        query = query.eq('creator_id', userId);
        break;
      case 'applications':
        // This would require a join with applications table
        // For now, return empty array
        return res.status(200).json({
          projects: [],
          total: 0,
          tab
        });
      default:
        query = query.eq('creator_id', userId);
    }

    // Order by creation date (most recent first)
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: projects, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log(`📋 My projects API called: userId=${userId}, tab=${tab}, found ${projects?.length || 0} projects`);

    return res.status(200).json({
      projects: projects || [],
      total: count || 0,
      tab,
      userId: userId // For debugging
    });

  } catch (error: any) {
    console.error('My projects API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}
