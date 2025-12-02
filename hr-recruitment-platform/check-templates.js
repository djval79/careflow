import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTemplates() {
    console.log('📄 Checking Document Templates...\n');

    const { data: templates, error } = await supabase
        .from('document_templates')
        .select('id, template_name, template_type');

    if (error) {
        console.error('❌ Error fetching templates:', error.message);
        return;
    }

    if (templates && templates.length > 0) {
        console.log(`✅ Found ${templates.length} templates:`);
        templates.forEach(t => {
            console.log(`   - [${t.id}] ${t.template_name} (${t.template_type})`);
        });
    } else {
        console.log('⚠️  No templates found. Migration might not have seeded data correctly.');
    }
}

checkTemplates().catch(console.error);
