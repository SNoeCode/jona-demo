// app/api/create-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const profileData = await request.json();    
    // Validate required fields
    if (!profileData.id || !profileData.email || !profileData.full_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: id, email, full_name' 
      }, { status: 400 });
    }

    // Create user profile in database
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        number: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        website: profileData.website,
        linkedin_url: profileData.linkedin_url,
        github_url: profileData.github_url,
        job_title: profileData.job_title,
        company: profileData.company,
        experience_level: profileData.experience_level,
        preferred_job_types: profileData.preferred_job_types,
        preferred_locations: profileData.preferred_locations,
        salary_range_min: profileData.salary_range_min,
        salary_range_max: profileData.salary_range_max,
        role: profileData.role || 'job_seeker',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile 
    });

  } catch (error) {
    console.error('Create profile API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

