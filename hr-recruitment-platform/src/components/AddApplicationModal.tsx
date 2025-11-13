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
    how_heard_about_job: '',
    status: 'applied'
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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

  function handleCvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        onError('Please upload a PDF, DOC, or DOCX file for your CV');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('CV file size must be less than 5MB');
        return;
      }
      setCvFile(file);
    }
  }

  function handleCertificateFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Validate each file
      const invalidFiles = files.filter(file => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        return !allowedTypes.includes(file.type) || file.size > 3 * 1024 * 1024;
      });
      
      if (invalidFiles.length > 0) {
        onError('Certificate files must be PDF, JPG, PNG, DOC, or DOCX and less than 3MB each');
        return;
      }
      
      if (files.length > 10) {
        onError('Maximum 10 certificate files allowed');
        return;
      }
      
      setCertificateFiles(files);
    }
  }

  function removeCertificate(index: number) {
    setCertificateFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.job_posting_id || !formData.applicant_email || !formData.applicant_first_name || !formData.applicant_last_name || !formData.how_heard_about_job) {
      onError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setUploadingFiles(true);

    try {
      let cvUrl = formData.resume_url;
      let certificateUrls: string[] = [];

      // Upload CV file if provided
      if (cvFile) {
        const uploadedCvUrl = await uploadFile(cvFile, 'applicant-cvs', 'resumes');
        if (uploadedCvUrl) {
          cvUrl = uploadedCvUrl;
        }
      }

      // Upload certificate files if provided
      if (certificateFiles.length > 0) {
        const uploadPromises = certificateFiles.map(file => 
          uploadFile(file, 'applicant-cvs', 'certificates')
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        certificateUrls = uploadedUrls.filter(url => url !== null) as string[];
      }
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
              resume_url: cvUrl,
              certificate_urls: certificateUrls.length > 0 ? certificateUrls : null,
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
          how_heard_about_job: '',
          status: 'applied'
        });
        setCvFile(null);
        setCertificateFiles([]);
      } else {
        throw new Error(result.error?.message || 'Failed to create application');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to create application');
    } finally {
      setLoading(false);
      setUploadingFiles(false);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume/CV</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Upload CV File (PDF, DOC, DOCX - Max 5MB)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCvFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {cvFile && (
                  <p className="text-sm text-green-600 mt-1">✓ Selected: {cvFile.name}</p>
                )}
              </div>
              <div className="text-center text-gray-500 text-sm">OR</div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Resume URL (if hosted online)</label>
                <input
                  type="url"
                  value={formData.resume_url}
                  onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                  placeholder="https://example.com/my-cv.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about this job? *</label>
            <select
              required
              value={formData.how_heard_about_job}
              onChange={(e) => setFormData({ ...formData, how_heard_about_job: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Select source...</option>
              <option value="company_website">Company Website</option>
              <option value="job_board_indeed">Indeed</option>
              <option value="job_board_linkedin">LinkedIn</option>
              <option value="job_board_reed">Reed</option>
              <option value="job_board_totaljobs">Total Jobs</option>
              <option value="social_media_facebook">Facebook</option>
              <option value="social_media_twitter">Twitter</option>
              <option value="social_media_instagram">Instagram</option>
              <option value="referral_employee">Employee Referral</option>
              <option value="referral_friend">Friend/Family Referral</option>
              <option value="recruitment_agency">Recruitment Agency</option>
              <option value="university_careers">University/Careers Service</option>
              <option value="newspaper_local">Local Newspaper</option>
              <option value="newspaper_national">National Newspaper</option>
              <option value="google_search">Google Search</option>
              <option value="other">Other</option>
            </select>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Certificates & Qualifications</label>
          <p className="text-xs text-gray-600 mb-2">Upload certificates, diplomas, or other relevant qualifications (PDF, JPG, PNG, DOC, DOCX - Max 3MB each, up to 10 files)</p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleCertificateFilesChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {certificateFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700">Selected files ({certificateFiles.length}/10):</p>
              {certificateFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeCertificate(index)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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
            disabled={loading || uploadingFiles}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {uploadingFiles ? 'Uploading files...' : loading ? 'Adding...' : 'Add Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
