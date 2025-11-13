import React, { useState } from 'react';
import Modal from './Modal';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AddTemplateModal({ isOpen, onClose, onSuccess, onError }: AddTemplateModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'offer_letter',
    category: '',
    subject: '',
    content: '',
    version: 1
  });

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
        `${supabaseUrl}/functions/v1/letter-template-crud`,
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
              version: parseInt(formData.version.toString()),
              is_active: true
            }
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.data) {
        onSuccess();
        onClose();
        setFormData({
          template_name: '',
          template_type: 'offer_letter',
          category: '',
          subject: '',
          content: '',
          version: 1
        });
      } else {
        throw new Error(result.error?.message || 'Failed to create template');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Letter Template" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input
              type="text"
              required
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              placeholder="e.g., Standard Offer Letter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Type *</label>
            <select
              required
              value={formData.template_type}
              onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="offer_letter">Offer Letter</option>
              <option value="appointment_letter">Appointment Letter</option>
              <option value="termination_letter">Termination Letter</option>
              <option value="promotion_letter">Promotion Letter</option>
              <option value="warning_letter">Warning Letter</option>
              <option value="experience_certificate">Experience Certificate</option>
              <option value="salary_slip">Salary Slip</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., HR, Legal, Onboarding"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <input
              type="number"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g., Job Offer - [position]"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use merge fields: [employee_name], [position], [department], [salary], [start_date]
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea
            required
            rows={10}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Dear [employee_name],&#10;&#10;We are pleased to offer you the position of [position] in the [department] department..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Available merge fields: [employee_name], [employee_number], [position], [department], [salary], [start_date], [company_name], [date]
          </p>
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
            {loading ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
