import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { User, Calendar, Clock, AlertTriangle, CheckCircle, Lock, MapPin } from 'lucide-react';

interface StaffMember {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    compliance_status: {
        dbs_status: 'compliant' | 'expired' | 'pending';
        rtw_status: 'compliant' | 'expired' | 'pending';
        training_status: 'compliant' | 'expired' | 'pending';
    } | null;
}

interface Visit {
    id: string;
    client: { first_name: string; last_name: string };
    visit_date: string;
    start_time: string;
    end_time: string;
    status: string;
    carer_id: string | null;
}

export default function Rostering() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [unassignedVisits, setUnassignedVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedVisit, setDraggedVisit] = useState<Visit | null>(null);

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load Staff
            const { data: staffData } = await supabase
                .from('users_profiles')
                .select(`
          id,
          user_id,
          full_name,
          avatar_url,
          compliance_status (
            dbs_status,
            rtw_status,
            training_status
          )
        `)
                .eq('role', 'carer');

            setStaff(staffData || []);

            // 2. Load Unassigned Visits
            const { data: visitsData } = await supabase
                .from('visits')
                .select(`
          id,
          visit_date,
          start_time,
          end_time,
          status,
          carer_id,
          client:clients (first_name, last_name)
        `)
                .is('carer_id', null); // Only unassigned

            setUnassignedVisits(visitsData || []);

        } catch (error) {
            console.error('Error loading roster data:', error);
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

    const handleDragStart = (visit: Visit) => {
        setDraggedVisit(visit);
    };

    const handleDrop = async (staffId: string, date: Date, member: StaffMember) => {
        if (!draggedVisit) return;

        // COMPLIANCE LOCK
        if (!isCompliant(member)) {
            alert(`⛔ COMPLIANCE LOCK\n\nCannot assign visits to ${member.full_name}.\nCheck DBS, Right to Work, or Training status.`);
            return;
        }

        try {
            // Optimistic update
            setUnassignedVisits(prev => prev.filter(v => v.id !== draggedVisit.id));

            // Database update
            const { error } = await supabase
                .from('visits')
                .update({
                    carer_id: member.user_id,
                    visit_date: format(date, 'yyyy-MM-dd'),
                    status: 'scheduled'
                })
                .eq('id', draggedVisit.id);

            if (error) throw error;

            // Reload to confirm
            loadData();

        } catch (error) {
            console.error('Drop failed:', error);
            alert('Failed to assign visit. Please try again.');
            loadData(); // Revert
        } finally {
            setDraggedVisit(null);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Smart Roster</h1>
                    <p className="text-slate-500">Drag visits to assign. Non-compliant staff are locked.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                        Publish Roster
                    </button>
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                {/* Unassigned Visits Sidebar */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Unassigned Visits
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {unassignedVisits.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">No unassigned visits</div>
                        ) : (
                            unassignedVisits.map(visit => (
                                <div
                                    key={visit.id}
                                    draggable
                                    onDragStart={() => handleDragStart(visit)}
                                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm cursor-move hover:border-indigo-400 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-slate-800">
                                            {visit.client?.first_name} {visit.client?.last_name}
                                        </span>
                                        <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                            {visit.start_time.slice(0, 5)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {format(parseISO(visit.visit_date), 'EEE d MMM')}
                                    </div>
                                </div>
                            ))
                        )}
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
                            <div className="p-8 text-center text-slate-500">Loading roster...</div>
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
                                            <div
                                                key={day.toString()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDrop(member.id, day, member)}
                                                className={`flex-1 border-r border-slate-200 last:border-r-0 min-h-[80px] relative transition-colors ${!compliant ? 'cursor-not-allowed' : 'hover:bg-indigo-50/50'
                                                    }`}
                                            >
                                                {!compliant && (
                                                    <div className="absolute inset-0 bg-stripes-red opacity-10" title="Staff Locked: Compliance Issue"></div>
                                                )}

                                                {/* Render Assigned Visits Here (Future) */}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
