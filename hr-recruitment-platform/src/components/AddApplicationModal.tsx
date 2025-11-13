import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  const [formData, setFormData] = useState({
    job_posting_id: '',
    applicant_first_name: '',
    applicant_last_name: '',
    applicant_email: '',
    applicant_phone: '',
    resume_url: '',
    cover_letter: '',
    years_of_experience: '',
    status: 'applied'
  });

  useEffect(() => {
    if (isOpen) {
      loadJobs();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

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
            data: {
              ...formData,
              years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : 0,
              source: 'manual_entry',
              created_by: user?.id
            }
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.data) {
        onSuccess();
        onClose();
        setFormData({
          job_posting_id: '',
          applicant_first_name: '',
          applicant_last_name: '',
          applicant_email: '',
          applicant_phone: '',
          resume_url: '',
          cover_letter: '',
          years_of_experience: '',
          status: 'applied'
        });
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Position *</label>
          <select
            required
            value={formData.job_posting_id}
            onChange={(e) => setFormData({ ...formData, job_posting_id: e.target.value })}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.applicant_first_name}
              onChange={(e) => setFormData({ ...formData, applicant_first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              required
              value={formData.applicant_last_name}
              onChange={(e) => setFormData({ ...formData, applicant_last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.applicant_email}
              onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={formData.applicant_phone}
              onChange={(e) => setFormData({ ...formData, applicant_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume URL</label>
            <input
              type="url"
              value={formData.resume_url}
              onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input
              type="number"
              min="0"
              value={formData.years_of_experience}
              onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="shortlisted">Shortlisted</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
          <textarea
            rows={4}
            value={formData.cover_letter}
            onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
