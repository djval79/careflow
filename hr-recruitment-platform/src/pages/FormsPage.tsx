import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Edit, Trash2, Eye } from 'lucide-react';
import FormBuilder, { FormField } from '@/components/FormBuilder/FormBuilder';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';

type FormType = 'application' | 'evaluation' | 'incident' | 'training' | 'leave' | 'performance' | 'other';
type FormCategory = 'recruitment' | 'hr' | 'compliance' | 'operations' | 'training';

interface FormTemplate {
    id: string;
    name: string;
    description: string;
    form_type: FormType;
    category: FormCategory;
    schema: FormField[];
    is_active: boolean;
    created_at: string;
}

const formTypeLabels: Record<FormType, string> = {
    application: 'Job Application',
    evaluation: 'Employee Evaluation',
    incident: 'Incident Report',
    training: 'Training Request',
    leave: 'Leave Request',
    performance: 'Performance Review',
    other: 'Other'
};

const formTypeColors: Record<FormType, string> = {
    application: 'bg-blue-100 text-blue-800',
    evaluation: 'bg-green-100 text-green-800',
    incident: 'bg-red-100 text-red-800',
    training: 'bg-purple-100 text-purple-800',
    leave: 'bg-yellow-100 text-yellow-800',
    performance: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800'
};

export default function FormsPage() {
    const [forms, setForms] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'create'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New form state
    const [newFormName, setNewFormName] = useState('');
    const [newFormDescription, setNewFormDescription] = useState('');
    const [newFormType, setNewFormType] = useState<FormType>('other');
    const [newFormCategory, setNewFormCategory] = useState<FormCategory>('hr');

    useEffect(() => {
        loadForms();
    }, []);

    async function loadForms() {
        setLoading(true);
        const { data, error } = await supabase
            .from('form_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setForms(data);
        }
        setLoading(false);
    }

    async function createNewForm() {
        if (!newFormName.trim()) {
            setToast({ message: 'Please enter a form name', type: 'error' });
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('form_templates')
            .insert({
                name: newFormName,
                description: newFormDescription,
                form_type: newFormType,
                category: newFormCategory,
                schema: [],
                is_active: true
            });

        if (error) {
            setToast({ message: 'Failed to create form', type: 'error' });
        } else {
            setToast({ message: 'Form created successfully', type: 'success' });
            setShowCreateModal(false);
            setNewFormName('');
            setNewFormDescription('');
            setNewFormType('other');
            setNewFormCategory('hr');
            loadForms();
        }
        setLoading(false);
    }

    async function deleteForm(id: string) {
        if (!confirm('Are you sure you want to delete this form?')) return;

        const { error } = await supabase
            .from('form_templates')
            .delete()
            .eq('id', id);

        if (error) {
            setToast({ message: 'Failed to delete form', type: 'error' });
        } else {
            setToast({ message: 'Form deleted successfully', type: 'success' });
            loadForms();
        }
    }

    async function saveFormSchema(schema: FormField[]) {
        if (!editingForm) return;

        const { error } = await supabase
            .from('form_templates')
            .update({ schema, updated_at: new Date().toISOString() })
            .eq('id', editingForm.id);

        if (error) {
            setToast({ message: 'Failed to save form', type: 'error' });
        } else {
            setToast({ message: 'Form saved successfully', type: 'success' });
            setEditingForm(null);
            loadForms();
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
                <p className="mt-1 text-sm text-gray-600">Create and manage forms for different purposes</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All Forms
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'create'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Create New
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'all' && (
                <div>
                    {editingForm ? (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Editing: {editingForm.name}</h2>
                                <button
                                    onClick={() => setEditingForm(null)}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    ← Back to List
                                </button>
                            </div>
                            <FormBuilder
                                key={editingForm.id}
                                initialSchema={editingForm.schema}
                                onSave={saveFormSchema}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {forms.map((form) => (
                                <div key={form.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{form.description || 'No description'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${formTypeColors[form.form_type]}`}>
                                            {formTypeLabels[form.form_type]}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                            {form.category}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingForm(form)}
                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteForm(form.id)}
                                            className="inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {forms.length === 0 && !loading && (
                                <div className="col-span-full text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No forms yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new form.</p>
                                    <button
                                        onClick={() => setActiveTab('create')}
                                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Form
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'create' && (
                <div className="max-w-2xl">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-6">Create New Form</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Form Name *</label>
                                <input
                                    type="text"
                                    value={newFormName}
                                    onChange={(e) => setNewFormName(e.target.value)}
                                    placeholder="e.g., Annual Performance Review"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newFormDescription}
                                    onChange={(e) => setNewFormDescription(e.target.value)}
                                    placeholder="Brief description of this form's purpose"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Form Type *</label>
                                <select
                                    value={newFormType}
                                    onChange={(e) => setNewFormType(e.target.value as FormType)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {Object.entries(formTypeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    value={newFormCategory}
                                    onChange={(e) => setNewFormCategory(e.target.value as FormCategory)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="recruitment">Recruitment</option>
                                    <option value="hr">HR</option>
                                    <option value="compliance">Compliance</option>
                                    <option value="operations">Operations</option>
                                    <option value="training">Training</option>
                                </select>
                            </div>

                            <button
                                onClick={createNewForm}
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Form'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
