import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import FormRenderer from './FormBuilder/FormRenderer';
import { FormField } from './FormBuilder/FormBuilder';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AddApplicationModal({ isOpen, onClose, onSuccess, onError }: AddApplicationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadJobs();
      loadFormSchema();
    }
  }, [isOpen]);

  async function loadJobs() {
    const { data } = await supabase
      .from('job_postings')
      .select('id, job_title, department, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    setJobs(data || []);
  }

  async function loadFormSchema() {
    // Load the active form template. For now, just take the first active one.
    // In a real app, you might link forms to specific jobs.
    const { data } = await supabase
      .from('form_templates')
      .select('schema')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && data.schema) {
      // Prepend standard required fields if they are not in the schema?
      // Or assume the admin configures them.
      // For safety, let's ensure the schema has the basics if it's empty, 
      // but ideally we trust the admin's schema.
      // We will prepend the Job Selection field manually in the UI as it's special.

      // We also need to ensure we have the basic applicant info fields if the schema doesn't have them.
      // But let's assume the "Standard Job Application" template we seeded covers this.
      // However, the seeded template didn't have Name/Email/Phone! 
      // I should probably add them to the form schema state if they are missing, 
      // or render them separately as "hardcoded" basics.

      // Let's render Name, Email, Phone hardcoded at the top, and then the dynamic form.
      // This ensures we always get the critical data.
      setFormSchema(data.schema);
    }
  }

  async function uploadFile(file: File, bucket: string, folder: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!selectedJobId) {
      onError('Please select a job position');
      return;
    }

    setLoading(true);

    try {
      // 1. Handle File Uploads
      const processedData: Record<string, any> = { ...formData };

      for (const [key, value] of Object.entries(formData)) {
        if (value instanceof File) {
          const url = await uploadFile(value, 'applicant-cvs', 'uploads');
          if (url) {
            processedData[key] = url;
          } else {
            throw new Error(`Failed to upload file for ${key}`);
          }
        }
      }

      // 2. Map to Database Columns
      const standardColumns = [
        'applicant_first_name', 'applicant_last_name', 'applicant_email', 'applicant_phone',
        'cv_url', 'cover_letter', 'portfolio_url', 'linkedin_url'
      ];

      const dbPayload: any = {
        job_posting_id: selectedJobId,
        status: 'applied',
        source: 'manual_entry',
        created_by: user?.id,
        custom_data: {}
      };

      // Handle hardcoded basic fields (we will add these to the UI separately)
      // But wait, FormRenderer handles the dynamic part.
      // I'll add the basic fields to the processedData from the separate inputs.
      // See render below.

      // Actually, let's just merge the basic fields into processedData before mapping.
      // But `handleSubmit` receives `formData` from `FormRenderer`.
      // I need to combine it with the basic fields state.
    } catch (error: any) {
      onError(error.message || 'Failed to create application');
      setLoading(false);
    }
  };

  // We need a wrapper to combine basic fields and dynamic form
  const [basicInfo, setBasicInfo] = useState({
    applicant_first_name: '',
    applicant_last_name: '',
    applicant_email: '',
    applicant_phone: ''
  });

  const handleFinalSubmit = async (dynamicData: Record<string, any>) => {
    if (!selectedJobId) {
      onError('Please select a job position');
      return;
    }
    if (!basicInfo.applicant_first_name || !basicInfo.applicant_last_name || !basicInfo.applicant_email) {
      onError('Please fill in all required basic information');
      return;
    }

    setLoading(true);

    try {
      // 1. Handle File Uploads in Dynamic Data
      const processedDynamicData: Record<string, any> = { ...dynamicData };

      for (const [key, value] of Object.entries(dynamicData)) {
        if (value instanceof File) {
          const url = await uploadFile(value, 'applicant-cvs', 'uploads');
          if (url) {
            processedDynamicData[key] = url;
          } else {
            throw new Error(`Failed to upload file for ${key}`);
          }
        }
      }

      // 2. Construct Payload
      const payload: any = {
        job_posting_id: selectedJobId,
        applicant_first_name: basicInfo.applicant_first_name,
        applicant_last_name: basicInfo.applicant_last_name,
        applicant_email: basicInfo.applicant_email,
        applicant_phone: basicInfo.applicant_phone,
        status: 'applied',
        source: 'manual_entry',
        created_by: user?.id,
        custom_data: {}
      };

      // Map dynamic fields
      const standardColumns = ['cv_url', 'cover_letter', 'portfolio_url', 'linkedin_url'];

      // Special mapping for resume_url -> cv_url
      if (processedDynamicData['resume_url']) {
        payload['cv_url'] = processedDynamicData['resume_url'];
        delete processedDynamicData['resume_url'];
      }

      for (const [key, value] of Object.entries(processedDynamicData)) {
        if (standardColumns.includes(key)) {
          payload[key] = value;
        } else {
          payload.custom_data[key] = value;
        }
      }

      // 3. Call API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/application-crud`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'create',
            data: payload
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.data) {
        onSuccess();
        onClose();
        // Reset form
        setBasicInfo({
          applicant_first_name: '',
          applicant_last_name: '',
          applicant_email: '',
          applicant_phone: ''
        });
        setSelectedJobId('');
      } else {
        throw new Error(result.error?.message || 'Failed to create application');
      }

    } catch (error: any) {
      onError(error.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Application" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Job Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Position *</label>
          <select
            required
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Select Job Position</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.job_title} - {job.department}
              </option>
            ))}
          </select>
        </div>

        {/* Basic Info (Hardcoded for consistency) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={basicInfo.applicant_first_name}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={basicInfo.applicant_last_name}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={basicInfo.applicant_email}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={basicInfo.applicant_phone}
              onChange={(e) => setBasicInfo({ ...basicInfo, applicant_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Dynamic Form */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <FormRenderer
            schema={formSchema}
            onSubmit={handleFinalSubmit}
            submitLabel={loading ? 'Submitting...' : 'Submit Application'}
            loading={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
