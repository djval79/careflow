import React, { useState } from 'react';
import { Shift, UserRole } from '../types';
import { ChevronLeft, ChevronRight, MapPin, User, Filter, Plus, Calendar as CalendarIcon, ArrowRight, Sparkles, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateRosterSuggestions } from '../services/geminiService';
import { MOCK_STAFF } from '../services/mockData';

// Extended initial shifts with some unassigned ones for demo
const initialShifts: Shift[] = [
  { id: '1', clientName: 'Arthur Dent', staffName: 'Sarah Jenkins', startTime: '08:00', endTime: '09:00', status: 'Scheduled', type: 'Personal Care' },
  { id: '2', clientName: 'Tricia McMillan', staffName: 'Sarah Jenkins', startTime: '09:30', endTime: '11:00', status: 'Completed', type: 'Domestic' },
  { id: '3', clientName: 'Ford Prefect', staffName: 'Mike Ross', startTime: '12:00', endTime: '13:00', status: 'Scheduled', type: 'Social' },
  { id: '4', clientName: 'Zaphod Beeblebrox', staffName: '', startTime: '14:00', endTime: '15:30', status: 'Unassigned', type: 'Personal Care' },
  { id: '5', clientName: 'Edith Crawley', staffName: '', startTime: '16:00', endTime: '17:00', status: 'Unassigned', type: 'Medical' },
  { id: '6', clientName: 'Robert Grantham', staffName: '', startTime: '18:00', endTime: '19:00', status: 'Unassigned', type: 'Social' },
];

const Rostering: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [autoScheduleReason, setAutoScheduleReason] = useState<Record<string, string>>({});

  // Stats
  const totalShifts = shifts.length;
  const unassignedCount = shifts.filter(s => s.status === 'Unassigned').length;
  const coveragePercent = Math.round(((totalShifts - unassignedCount) / totalShifts) * 100);

  // Filter shifts based on Role
  let visibleShifts = shifts;

  if (user?.role === UserRole.CARER) {
    // Carers see their own shifts
    visibleShifts = shifts.filter(s => s.staffName === user.name || s.staffName === 'Sarah Jenkins'); 
  } else if (user?.role === UserRole.FAMILY || user?.role === UserRole.CLIENT) {
    // Family/Client see only their shifts
    const clientNameTarget = user.name === 'Edith Crawley' ? 'Edith Crawley' : 'Arthur Dent';
    visibleShifts = shifts.filter(s => s.clientName === clientNameTarget);
  }
  // Admin sees all (default)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleAutoSchedule = async () => {
    setIsAutoScheduling(true);
    try {
      const suggestions = await generateRosterSuggestions(shifts, MOCK_STAFF);
      
      if (suggestions.length > 0) {
        // Apply suggestions
        const updatedShifts = shifts.map(shift => {
          const suggestion = suggestions.find(s => s.shiftId === shift.id);
          if (suggestion) {
            return { ...shift, staffName: suggestion.staffName, status: 'Scheduled' as const };
          }
          return shift;
        });
        
        // Store reasons for UI feedback
        const reasons: Record<string, string> = {};
        suggestions.forEach(s => reasons[s.shiftId] = s.reason);
        
        setShifts(updatedShifts);
        setAutoScheduleReason(reasons);
      }
    } catch (error) {
      console.error("Auto schedule failed", error);
    } finally {
      setIsAutoScheduling(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rostering & Schedule</h1>
          <p className="text-slate-500 text-sm">Manage shifts and view daily assignments.</p>
        </div>
        
        {user?.role === UserRole.ADMIN && (
          <div className="flex gap-2">
             <button 
               onClick={handleAutoSchedule}
               disabled={isAutoScheduling || unassignedCount === 0}
               className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all
                 ${unassignedCount > 0 
                   ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-md' 
                   : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
             >
                {isAutoScheduling ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
                {isAutoScheduling ? 'Optimizing Schedule...' : 'Auto-Fill with AI'}
             </button>
             <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 flex items-center gap-2">
               <Plus size={18} />
               Add Shift
             </button>
          </div>
        )}
      </div>

      {/* Coverage Status Bar (Admin Only) */}
      {user?.role === UserRole.ADMIN && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CalendarIcon size={20}/></div>
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase">Total Shifts</p>
                 <p className="text-xl font-bold text-slate-800">{totalShifts}</p>
              </div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-3 rounded-lg ${unassignedCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                 {unassignedCount > 0 ? <RefreshCw size={20}/> : <CheckCircle2 size={20}/>}
              </div>
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase">Unassigned</p>
                 <p className={`text-xl font-bold ${unassignedCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{unassignedCount}</p>
              </div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Sparkles size={20}/></div>
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase">Roster Coverage</p>
                 <p className="text-xl font-bold text-slate-800">{coveragePercent}%</p>
              </div>
           </div>
        </div>
      )}

      {/* Date Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <CalendarIcon size={20} className="text-primary-600" />
            {formatDate(currentDate)}
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-white">
            Today
          </button>
          <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Shift List */}
      <div className="grid grid-cols-1 gap-4">
        {visibleShifts.map((shift) => (
          <div 
            key={shift.id} 
            className={`bg-white p-5 rounded-xl border transition-all hover:shadow-md relative overflow-hidden
              ${shift.status === 'Completed' ? 'opacity-75 bg-slate-50 border-slate-200' : 'border-slate-200'}
              ${autoScheduleReason[shift.id] ? 'ring-2 ring-purple-500 border-purple-500' : ''}
            `}
          >
            {autoScheduleReason[shift.id] && (
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1">
                <Sparkles size={10} /> AI Suggested
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-0">
              
              {/* Time & Status */}
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="text-center min-w-[80px]">
                  <div className="text-lg font-bold text-slate-900">{shift.startTime}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase">to {shift.endTime}</div>
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{shift.clientName}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                     <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{shift.type}</span>
                     {user?.role === UserRole.ADMIN && (
                       <div className="flex items-center gap-2">
                         <span className="flex items-center gap-1"><User size={12}/> {shift.staffName || 'Unassigned'}</span>
                         {autoScheduleReason[shift.id] && (
                            <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              {autoScheduleReason[shift.id]}
                            </span>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full md:w-auto flex justify-end">
                {shift.status === 'Unassigned' ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <User size={12}/> Unassigned
                  </span>
                ) : (
                  <>
                    {(user?.role === UserRole.CARER || user?.role === UserRole.ADMIN) ? (
                      <Link 
                        to={`/visit/${shift.id}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors
                          ${shift.status === 'Completed' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-900/20'
                          }`}
                      >
                        {shift.status === 'Completed' ? 'View Report' : 'View Visit'} 
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                        ${shift.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}
                      `}>
                        {shift.status}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {visibleShifts.length === 0 && (
           <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
             <CalendarIcon size={48} className="mx-auto mb-2 opacity-20" />
             <p>No shifts found for this date.</p>
             {user?.role === UserRole.FAMILY && <p className="text-xs mt-1">Only shifts for your assigned family member are shown.</p>}
           </div>
        )}
      </div>
    </div>
  );
};

export default Rostering;