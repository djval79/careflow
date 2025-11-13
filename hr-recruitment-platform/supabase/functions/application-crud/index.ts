Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid token');
    }

    const user = await userResponse.json();
    const userId = user.id;

    const requestBody = await req.json();
    const action = requestBody.action || 'create';
    const data = requestBody.data || requestBody;

    if (action === 'create') {
      // Parse candidate name if it's in combined format
      let firstName, lastName;
      if (data.candidate_name) {
        const nameParts = data.candidate_name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || nameParts[0];
      } else {
        firstName = data.first_name || data.applicant_first_name;
        lastName = data.last_name || data.applicant_last_name;
      }

      const applicationData = {
        job_posting_id: data.job_id || data.job_posting_id,
        applicant_first_name: firstName,
        applicant_last_name: lastName,
        applicant_email: data.email || data.applicant_email,
        applicant_phone: data.phone || data.applicant_phone || null,
        cv_url: data.resume_url || data.cv_url || 'https://example.com/resume.pdf',
        cover_letter: data.cover_letter || null,
        portfolio_url: data.portfolio_url || null,
        linkedin_url: data.linkedin_url || null,
        current_location: data.current_location || null,
        desired_salary: data.desired_salary || null,
        notice_period: data.notice_period || null,
        status: data.status || 'applied',
        pipeline_stage: data.pipeline_stage || 'screening',
        score: data.score || null,
        notes: data.notes || null,
        source: data.source || 'direct',
        applied_at: new Date().toISOString(),
        last_updated_by: userId
      };

      const createResponse = await fetch(`${supabaseUrl}/rest/v1/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(applicationData)
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`Failed to create application: ${JSON.stringify(error)}`);
      }

      const createdApplication = await createResponse.json();
      const application = Array.isArray(createdApplication) ? createdApplication[0] : createdApplication;

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'CREATE_APPLICATION',
          entity_type: 'applications',
          entity_id: application.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: application }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else if (action === 'update') {
      const updateData: any = {};
      if (data.status) updateData.status = data.status;
      if (data.pipeline_stage) updateData.pipeline_stage = data.pipeline_stage;
      if (data.score !== undefined) updateData.score = data.score;
      if (data.notes !== undefined) updateData.notes = data.notes;
      updateData.last_updated_by = userId;
      updateData.updated_at = new Date().toISOString();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${data.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(`Failed to update application: ${JSON.stringify(error)}`);
      }

      const updatedApplication = await updateResponse.json();
      const application = Array.isArray(updatedApplication) ? updatedApplication[0] : updatedApplication;

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'UPDATE_APPLICATION',
          entity_type: 'applications',
          entity_id: application.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: application }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else if (action === 'delete') {
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${data.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          }
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(`Failed to delete application: ${JSON.stringify(error)}`);
      }

      const deletedApplication = await deleteResponse.json();
      const application = Array.isArray(deletedApplication) ? deletedApplication[0] : deletedApplication;

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'DELETE_APPLICATION',
          entity_type: 'applications',
          entity_id: application.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: application }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'APPLICATION_OPERATION_FAILED',
          message: error.message
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
    );
  }
});
