import React, { useState } from 'react';
import { Settings, Sliders, CheckSquare, FileText, Users, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';

export default function RecruitSettingsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'Standard Hiring', stages: ['Application', 'Phone Screen', 'Interview', 'Offer'] },
    { id: 2, name: 'Senior Position', stages: ['Application', 'HR Screen', 'Technical Interview', 'Panel Interview', 'Background Check', 'Offer'] }
  ]);
  
  const [formFields, setFormFields] = useState([
    { id: 1, name: 'Full Name', type: 'text', required: true },
    { id: 2, name: 'Email', type: 'email', required: true },
    { id: 3, name: 'Phone', type: 'tel', required: true },
    { id: 4, name: 'Resume', type: 'file', required: true },
    { id: 5, name: 'Cover Letter', type: 'textarea', required: false }
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

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure recruitment workflows and processes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recruitment Workflows */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Sliders className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Recruitment Workflows</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Customize the stages and processes for your recruitment pipeline
          </p>
          <button 
            onClick={() => openModal('workflows')}
            className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Manage Workflows
          </button>
        </div>

        {/* Application Form Builder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Application Form</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Customize fields and questions for your application forms
          </p>
          <button 
            onClick={() => openModal('form')}
            className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Customize Form
          </button>
        </div>

        {/* Evaluation Criteria */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Evaluation Criteria</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Set up scoring criteria for candidate evaluations
          </p>
          <button 
            onClick={() => openModal('criteria')}
            className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Configure Criteria
          </button>
        </div>

        {/* Onboarding Checklists */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Onboarding Checklists</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Create and manage onboarding tasks for new hires
          </p>
          <button 
            onClick={() => openModal('checklists')}
            className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Manage Checklists
          </button>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Settings</h2>
        
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

      {/* Workflows Modal */}
      {activeModal === 'workflows' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Manage Recruitment Workflows"
        >
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <Plus className="w-5 h-5 mx-auto mb-1" />
              Add New Workflow
            </button>
          </div>
        </Modal>
      )}

      {/* Form Builder Modal */}
      {activeModal === 'form' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Customize Application Form"
        >
          <div className="space-y-4">
            {formFields.map((field) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{field.name}</h3>
                    <p className="text-sm text-gray-500">Type: {field.type} | {field.required ? 'Required' : 'Optional'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <Plus className="w-5 h-5 mx-auto mb-1" />
              Add New Field
            </button>
          </div>
        </Modal>
      )}

      {/* Evaluation Criteria Modal */}
      {activeModal === 'criteria' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Configure Evaluation Criteria"
        >
          <div className="space-y-4">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{criterion.name}</h3>
                    <p className="text-sm text-gray-500">Weight: {criterion.weight}% | Max Score: {criterion.maxScore}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${criterion.weight}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <Plus className="w-5 h-5 mx-auto mb-1" />
              Add New Criterion
            </button>
          </div>
        </Modal>
      )}

      {/* Onboarding Checklists Modal */}
      {activeModal === 'checklists' && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Manage Onboarding Checklists"
        >
          <div className="space-y-4">
            {checklists.map((checklist) => (
              <div key={checklist.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{checklist.name}</h3>
                  <div className="flex space-x-2">
                    <button className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <Plus className="w-5 h-5 mx-auto mb-1" />
              Add New Checklist
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
