import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse filters from query params
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '12');
    const search = req.query.search as string || '';
    const category = req.query.category as string || '';
    const stage = req.query.stage as string || '';
    const location = req.query.location as string || '';
    const sort_by = req.query.sort_by as string || 'recent';
    const sort_order = req.query.sort_order as string || 'desc';

    // Construir la query
    let query = supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tagline.ilike.%${search}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }

    // Solo mostrar proyectos activos y públicos
    query = query.eq('status', 'active').eq('visibility', 'public');

    // Aplicar ordenamiento
    let orderColumn = 'created_at';
    switch (sort_by) {
      case 'popular':
        orderColumn = 'like_count';
        break;
      case 'trending':
        orderColumn = 'view_count';
        break;
      case 'views':
        orderColumn = 'view_count';
        break;
      case 'likes':
        orderColumn = 'like_count';
        break;
      case 'applications':
        orderColumn = 'application_count';
        break;
      case 'alphabetical':
        orderColumn = 'title';
        break;
      default:
        orderColumn = 'created_at';
    }

    query = query.order(orderColumn, { ascending: sort_order === 'asc' });

    // Aplicar paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Ejecutar la query
    const { data: projects, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response = {
      projects: projects || [],
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      filters: {
        search,
        category,
        stage,
        location,
        sort_by,
        sort_order
      }
    };

    console.log(`🔍 Search API called with: page=${page}, limit=${limit}, search="${search}", category="${category}", found ${projects?.length || 0} projects`);
    
    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Search projects error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}
