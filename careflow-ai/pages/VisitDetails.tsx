import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, CheckSquare, AlertTriangle, FileText, Key, ShieldAlert, ChevronLeft, Save, Loader2 } from 'lucide-react';
import { analyzeRiskScenario } from '../services/geminiService';

// Mock Data for the visit
const MOCK_VISIT = {
  id: '1',
  clientName: 'Arthur Dent',
  address: '155 Country Lane, Cottington',
  keySafe: '4590',
  startTime: '08:00',
  endTime: '09:00',
  careType: 'Personal Care',
  tasks: [
    { id: 't1', label: 'Assist with morning wash', completed: false },
    { id: 't2', label: 'Prepare breakfast (Porridge)', completed: false },
    { id: 't3', label: 'Prompt medication (Blister pack)', completed: false },
    { id: 't4', label: 'Check heating is on', completed: false },
  ],
  criticalRisks: [
    { risk: 'Fall Risk', note: 'Unsteady on feet in mornings' },
    { risk: 'Skin Integrity', note: 'Monitor red area on left heel' }
  ]
};

const VisitDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [status, setStatus] = useState<'Scheduled' | 'In Progress' | 'Completed'>('Scheduled');
  const [tasks, setTasks] = useState(MOCK_VISIT.tasks);
  const [showKeySafe, setShowKeySafe] = useState(false);
  const [notes, setNotes] = useState('');
  
  // AI Incident Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleStatusChange = () => {
    if (status === 'Scheduled') setStatus('In Progress');
    else if (status === 'In Progress') setStatus('Completed');
  };

  const handleAnalyzeIncident = async () => {
    if (!notes.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeRiskScenario(notes);
      setAiAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header / Navigation */}
      <div className="flex items-center gap-2 text-slate-500 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-medium">Back to Roster</span>
      </div>

      {/* Main Visit Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{MOCK_VISIT.clientName}</h1>
              <div className="flex items-center gap-2 text-slate-600 mt-1 text-sm">
                <MapPin size={16} />
                {MOCK_VISIT.address}
              </div>
            </div>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {MOCK_VISIT.careType}
            </div>
          </div>
          
          {/* Key Safe Toggle */}
          <div className="mt-4 flex items-center gap-2">
             <button 
               onClick={() => setShowKeySafe(!showKeySafe)}
               className="flex items-center gap-2 text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition-colors"
             >
               <Key size={14} />
               {showKeySafe ? `Code: ${MOCK_VISIT.keySafe}` : 'Show Access Code'}
             </button>
             <div className="text-xs text-slate-400 flex items-center gap-1">
               <Clock size={14} />
               {MOCK_VISIT.startTime} - {MOCK_VISIT.endTime}
             </div>
          </div>
        </div>

        {/* Check In / Out Action */}
        <div className="p-6 flex flex-col items-center justify-center bg-white border-b border-slate-100">
          <button 
            onClick={handleStatusChange}
            disabled={status === 'Completed'}
            className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3
              ${status === 'Scheduled' 
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/20' 
                : status === 'In Progress'
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            {status === 'Scheduled' && <><Clock /> CHECK IN</>}
            {status === 'In Progress' && <><Clock /> CHECK OUT</>}
            {status === 'Completed' && <><CheckSquare /> VISIT COMPLETED</>}
          </button>
          {status === 'In Progress' && (
            <p className="text-xs text-green-600 font-medium mt-3 animate-pulse">
              ● Time tracking active
            </p>
          )}
        </div>

        {/* Critical Risks */}
        <div className="p-6 border-b border-slate-100 bg-amber-50/30">
           <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
             <ShieldAlert size={16} /> Critical Alerts
           </h3>
           <div className="space-y-2">
             {MOCK_VISIT.criticalRisks.map((risk, i) => (
               <div key={i} className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 p-2 rounded border border-amber-100">
                 <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                 <span><span className="font-bold">{risk.risk}:</span> {risk.note}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Tasks */}
        <div className="p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare size={20} className="text-primary-600" />
            Care Tasks
          </h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <label 
                key={task.id} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                  ${task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-slate-200 hover:border-primary-300'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                  ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                  {task.completed && <CheckSquare size={14} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  onChange={() => toggleTask(task.id)}
                  className="hidden"
                />
                <span className={`text-sm font-medium ${task.completed ? 'text-green-800 line-through decoration-green-800/30' : 'text-slate-700'}`}>
                  {task.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Notes & Incident Reporting */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <FileText size={20} className="text-primary-600" />
           Visit Notes & Incidents
         </h3>
         
         <textarea
           className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-h-[120px] mb-4"
           placeholder="Record general notes or describe an incident here..."
           value={notes}
           onChange={(e) => setNotes(e.target.value)}
         ></textarea>

         <div className="flex items-center justify-between gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
               <Save size={16} /> Save Notes
            </button>
            <button 
               onClick={handleAnalyzeIncident}
               disabled={!notes || isAnalyzing}
               className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-200 disabled:opacity-50"
            >
               {isAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <ShieldAlert size={16} />}
               Analyze Risk
            </button>
         </div>

         {/* AI Analysis Result */}
         {aiAnalysis && (
           <div className="mt-6 bg-slate-800 text-slate-100 p-5 rounded-xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold uppercase text-xs tracking-wider">
                <ShieldAlert size={14} /> AI Risk Assessment
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{aiAnalysis}</p>
           </div>
         )}
      </div>
    </div>
  );
};

export default VisitDetails;