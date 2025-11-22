import React, { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Save } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file';

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select inputs
    accept?: string; // For file inputs
}

interface FormBuilderProps {
    initialSchema?: FormField[];
    onSave: (schema: FormField[]) => void;
}

export default function FormBuilder({ initialSchema = [], onSave }: FormBuilderProps) {
    const [fields, setFields] = useState<FormField[]>(initialSchema);

    const addField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: 'text',
            label: 'New Question',
            required: false
        };
        setFields([...fields, newField]);
    };

    const removeField = (index: number) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === fields.length - 1)
        ) {
            return;
        }

        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        setFields(newFields);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Label</label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={field.type}
                                        onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="select">Dropdown</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="date">Date</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center ml-4 space-x-2">
                                <button
                                    onClick={() => moveField(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <MoveUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => moveField(index, 'down')}
                                    disabled={index === fields.length - 1}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <MoveDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => removeField(index)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`required_${field.id}`}
                                    checked={field.required}
                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`required_${field.id}`} className="ml-2 block text-sm text-gray-900">
                                    Required
                                </label>
                            </div>

                            {field.type === 'select' && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma separated)</label>
                                    <input
                                        type="text"
                                        value={field.options?.join(', ') || ''}
                                        onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                        placeholder="Option 1, Option 2, Option 3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {fields.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">No questions yet. Click "Add Question" to start.</p>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button
                        onClick={addField}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </button>

                    <button
                        onClick={() => onSave(fields)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Form
                    </button>
                </div>
            </div>
        </div>
    );
}
