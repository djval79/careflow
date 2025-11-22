import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Sliders, CheckSquare, FileText, Users, Plus, Edit, Trash2, Save } from 'lucide-react';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import FormBuilder, { FormField } from '@/components/FormBuilder/FormBuilder';

type TabType = 'general' | 'workflows' | 'forms' | 'criteria' | 'checklists';

export default function RecruitSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Form Builder State
  const [formTemplates, setFormTemplates] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);

  // Mock Data for other tabs
  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'Standard Hiring', stages: ['Application', 'Phone Screen', 'Interview', 'Offer'] },
    { id: 2, name: 'Senior Position', stages: ['Application', 'HR Screen', 'Technical Interview', 'Panel Interview', 'Background Check', 'Offer'] }
  ]);

  const [criteria, setCriteria] = useState([
    { id: 1, name: 'Technical Skills', weight: 30, maxScore: 10 },
    { id: 2, name: 'Communication', weight: 25, maxScore: 10 },
    { id: 3, name: 'Experience', weight: 25, maxScore: 10 },
    { id: 4, name: 'Cultural Fit', weight: 20, maxScore: 10 }
  ]);

  const [checklists, setChecklists] = useState([
    { id: 1, name: 'IT Setup', tasks: ['Create email account', 'Setup workstation', 'Install software', 'Provide access cards'] },
    { id: 2, name: 'HR Orientation', tasks: ['Welcome meeting', 'Handbook review', 'Benefits enrollment', 'Emergency contacts'] }
  ]);

  useEffect(() => {
    if (activeTab === 'forms') {
      loadFormTemplates();
    }
  }, [activeTab]);

  async function loadFormTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setFormTemplates(data);
      if (data.length > 0 && !selectedForm) {
        setSelectedForm(data[0]);
      }
    }
    setLoading(false);
  }

  async function saveFormSchema(schema: FormField[]) {
    if (!selectedForm) return;

    setLoading(true);
    const { error } = await supabase
      .from('form_templates')
      .update({
        schema,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedForm.id);

    if (error) {
      setToast({ message: 'Failed to save form', type: 'error' });
    } else {
      setToast({ message: 'Form saved successfully', type: 'success' });
      loadFormTemplates();
    }
    setLoading(false);
  }

  const closeModal = () => setActiveModal(null);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'forms', label: 'Application Forms' },
    { id: 'criteria', label: 'Evaluation Criteria' },
    { id: 'checklists', label: 'Onboarding Checklists' }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure your recruitment process and templates</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Automated Interview Reminders</h3>
                  <p className="text-xs text-gray-500 mt-1">Send automated reminders before scheduled interviews</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Application Acknowledgement</h3>
                  <p className="text-xs text-gray-500 mt-1">Auto-send acknowledgement emails to applicants</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recruitment Workflows</h2>
              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Workflow
              </button>
            </div>
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {workflow.stages.map((stage, index) => (
                    <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                      {index + 1}. {stage}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'forms' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Application Forms</h2>
              <div className="flex space-x-2">
                <select
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedForm?.id || ''}
                  onChange={(e) => setSelectedForm(formTemplates.find(f => f.id === e.target.value))}
                >
                  {formTemplates.map(form => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedForm ? (
              <FormBuilder
                initialSchema={selectedForm.schema}
                onSave={saveFormSchema}
              />
            ) : (
              <div className="text-center py-12">
                {loading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                ) : (
                  <p className="text-gray-500">No form templates found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'criteria' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Evaluation Criteria</h2>
              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Criterion
              </button>
            </div>
            {criteria.map((criterion) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{criterion.name}</h3>
                    <p className="text-sm text-gray-500">Weight: {criterion.weight}% | Max Score: {criterion.maxScore}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${criterion.weight}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'checklists' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Onboarding Checklists</h2>
              <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Plus className="w-4 h-4 mr-2" />
                Add Checklist
              </button>
            </div>
            {checklists.map((checklist) => (
              <div key={checklist.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{checklist.name}</h3>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  {checklist.tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
