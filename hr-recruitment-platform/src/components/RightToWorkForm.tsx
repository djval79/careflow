import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { rtwService } from '@/lib/services/RightToWorkService';
import { useTenant } from '@/contexts/TenantContext';
import { Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RightToWorkFormData {
    staff_name: string;
    document_type: 'passport_uk' | 'passport_non_uk' | 'biometric_residence_permit' | 'birth_certificate_ni_number' | 'share_code' | 'other';
    document_number: string;
    nationality: string;
    visa_type?: string;
    visa_expiry?: string;
    share_code?: string;
    check_date: string;
    notes?: string;
    document_file?: FileList;
}

interface RightToWorkFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function RightToWorkForm({ onSuccess, onCancel }: RightToWorkFormProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RightToWorkFormData>();

    const documentType = watch('document_type');
    const shareCode = watch('share_code');

    const handleVerifyShareCode = async () => {
        if (!shareCode) return;
        setVerifying(true);
        try {
            // In a real scenario, we'd ask for DOB too
            const result = await rtwService.verifyShareCode(shareCode, '1990-01-01');
            setVerificationResult(result);
            if (result.valid && result.details) {
                setValue('staff_name', result.details.name);
                setValue('visa_expiry', result.details.expiry);
            }
        } catch (error) {
            console.error('Verification failed', error);
        } finally {
            setVerifying(false);
        }
    };

    const onSubmit = async (data: RightToWorkFormData) => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            let documentUrl = '';

            if (data.document_file && data.document_file.length > 0) {
                const file = data.document_file[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `rtw-documents/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('compliance-docs')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;
                documentUrl = filePath;
            }

            // Calculate next check date based on visa expiry or default (e.g., 1 year)
            let nextCheckDate = null;
            if (data.visa_expiry) {
                nextCheckDate = data.visa_expiry;
            } else if (data.document_type === 'passport_uk') {
                // UK citizens don't need re-checks usually, but let's set a long date or null
                nextCheckDate = null;
            } else {
                // Default 6 months for others if no expiry specified
                const d = new Date(data.check_date);
                d.setMonth(d.getMonth() + 6);
                nextCheckDate = d.toISOString().split('T')[0];
            }

            await rtwService.addCheck({
                tenant_id: currentTenant.id,
                staff_name: data.staff_name,
                document_type: data.document_type,
                document_number: data.document_number,
                nationality: data.nationality,
                visa_type: data.visa_type,
                visa_expiry: data.visa_expiry || undefined,
                share_code: data.share_code,
                check_date: data.check_date,
                next_check_date: nextCheckDate || undefined,
                status: 'verified',
                document_url: documentUrl,
                notes: data.notes
            });

            onSuccess();
        } catch (error) {
            console.error('Error submitting RTW check:', error);
            alert('Failed to submit check. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">New Right to Work Check</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Document Type</label>
                            <select
                                {...register('document_type', { required: 'Document type is required' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            >
                                <option value="">Select Document Type</option>
                                <option value="passport_uk">UK Passport</option>
                                <option value="passport_non_uk">Non-UK Passport</option>
                                <option value="biometric_residence_permit">Biometric Residence Permit</option>
                                <option value="share_code">Home Office Share Code</option>
                                <option value="birth_certificate_ni_number">Birth Certificate & NI Number</option>
                                <option value="other">Other</option>
                            </select>
                            {errors.document_type && <p className="text-red-500 text-xs mt-1">{errors.document_type.message}</p>}
                        </div>

                        {documentType === 'share_code' && (
                            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <label className="block text-sm font-medium text-blue-900">Share Code</label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        type="text"
                                        {...register('share_code')}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                        placeholder="W12-345-678"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyShareCode}
                                        disabled={verifying || !shareCode}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                    </button>
                                </div>
                                {verificationResult && (
                                    <div className={`mt-2 text-sm ${verificationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                                        {verificationResult.valid ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Valid Share Code
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" /> Invalid Code
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Staff Name</label>
                            <input
                                type="text"
                                {...register('staff_name', { required: 'Staff name is required' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                            {errors.staff_name && <p className="text-red-500 text-xs mt-1">{errors.staff_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nationality</label>
                            <input
                                type="text"
                                {...register('nationality', { required: 'Nationality is required' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Document Number</label>
                            <input
                                type="text"
                                {...register('document_number')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Check Date</label>
                            <input
                                type="date"
                                {...register('check_date', { required: 'Check date is required' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        </div>

                        {(documentType !== 'passport_uk' && documentType !== 'birth_certificate_ni_number') && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Visa/Permit Type</label>
                                    <input
                                        type="text"
                                        {...register('visa_type')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Visa Expiry Date</label>
                                    <input
                                        type="date"
                                        {...register('visa_expiry')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                                    />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Upload Document Evidence</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                                            <span>Upload a file</span>
                                            <input type="file" className="sr-only" {...register('document_file')} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save RTW Check
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
