import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';
import { User, Calendar, Clock, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

interface StaffMember {
    id: string;
    full_name: string;
    avatar_url: string | null;
    compliance_status: {
        dbs_status: 'compliant' | 'expired' | 'pending';
        rtw_status: 'compliant' | 'expired' | 'pending';
        training_status: 'compliant' | 'expired' | 'pending';
    } | null;
}

export default function Rostering() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            // Fetch staff and their compliance status from NovumFlow tables
            // Note: We need to join with compliance_status table
            const { data, error } = await supabase
                .from('users_profiles')
                .select(`
          id,
          full_name,
          avatar_url,
          compliance_status (
            dbs_status,
            rtw_status,
            training_status
          )
        `)
                .eq('role', 'carer'); // Only fetch carers

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const isCompliant = (member: StaffMember) => {
        const status = member.compliance_status;
        if (!status) return false;
        return status.dbs_status === 'compliant' &&
            status.rtw_status === 'compliant' &&
            status.training_status === 'compliant';
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Smart Roster</h1>
                    <p className="text-slate-500">Drag and drop to assign visits. Non-compliant staff are locked.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                        Auto-Fill
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Publish Roster
                    </button>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Header Row */}
                <div className="flex border-b border-slate-200">
                    <div className="w-64 p-4 border-r border-slate-200 bg-slate-50 font-semibold text-slate-700">
                        Staff Member
                    </div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className="flex-1 p-4 text-center border-r border-slate-200 last:border-r-0 bg-slate-50">
                            <div className="font-semibold text-slate-900">{format(day, 'EEE')}</div>
                            <div className="text-xs text-slate-500">{format(day, 'd MMM')}</div>
                        </div>
                    ))}
                </div>

                {/* Staff Rows */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading staff...</div>
                    ) : (
                        staff.map(member => {
                            const compliant = isCompliant(member);
                            return (
                                <div key={member.id} className={`flex border-b border-slate-100 ${!compliant ? 'bg-red-50/50' : ''}`}>
                                    {/* Staff Info Column */}
                                    <div className="w-64 p-4 border-r border-slate-200 flex items-center gap-3">
                                        <div className="relative">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            {!compliant && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-white" title="Non-Compliant">
                                                    <Lock className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{member.full_name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                {compliant ? (
                                                    <><CheckCircle className="w-3 h-3 text-green-500" /> Active</>
                                                ) : (
                                                    <><AlertTriangle className="w-3 h-3 text-red-500" /> Locked</>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Days Columns */}
                                    {weekDays.map(day => (
                                        <div key={day.toString()} className="flex-1 border-r border-slate-200 last:border-r-0 min-h-[80px] relative group">
                                            {!compliant && (
                                                <div className="absolute inset-0 bg-stripes-red opacity-10 cursor-not-allowed" title="Staff Locked: Compliance Issue"></div>
                                            )}
                                            {/* Drop Zone (Placeholder) */}
                                            <div className="absolute inset-0 hover:bg-slate-50 transition-colors"></div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
