
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Users, MapPin, ChevronRight, ArrowRight, MessageSquare, CalendarHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';

const visitData = [
  { name: 'Mon', visits: 45, completed: 42 },
  { name: 'Tue', visits: 52, completed: 50 },
  { name: 'Wed', visits: 48, completed: 48 },
  { name: 'Thu', visits: 61, completed: 55 },
  { name: 'Fri', visits: 55, completed: 54 },
  { name: 'Sat', visits: 38, completed: 38 },
  { name: 'Sun', visits: 40, completed: 39 },
];

const complianceData = [
  { name: 'Training', value: 92 },
  { name: 'DBS', value: 98 },
  { name: 'Reviews', value: 85 },
];

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ElementType; color: string }> = ({ 
  title, value, change, icon: Icon, color 
}) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <span className="text-xs font-medium text-green-600 mt-4 inline-block bg-green-50 px-2 py-1 rounded">
      {change}
    </span>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isCarer = user?.role === UserRole.CARER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isFamilyOrClient = user?.role === UserRole.FAMILY || user?.role === UserRole.CLIENT;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 text-sm">Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
             <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
               Export Report
             </button>
             <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-primary-700">
               + New Shift
             </button>
          </div>
        )}
      </div>

      {/* --- CARER VIEW --- */}
      {isCarer && (
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-2 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider mb-2">Up Next / Current</span>
                  <h2 className="text-2xl font-bold">Arthur Dent</h2>
                  <div className="flex items-center gap-2 text-primary-100 mt-1">
                    <MapPin size={16} /> 155 Country Lane, Cottington
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">08:00</div>
                  <div className="text-sm text-primary-200">Scheduled Start</div>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm">Personal Care</span>
                   <span className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm">4 Tasks</span>
                </div>
                <Link to="/visit/1" className="bg-white text-primary-900 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center gap-2">
                  Start Visit <ArrowRight size={18} />
                </Link>
             </div>
           </div>
        </div>
      )}

      {/* --- FAMILY / CLIENT VIEW --- */}
      {isFamilyOrClient && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Who's Visiting Card */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <Clock size={100} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Next Scheduled Visit</h3>
              <p className="text-slate-500 text-sm mb-4">Your care team today.</p>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700 border-4 border-white shadow-sm">
                    SJ
                 </div>
                 <div>
                    <p className="font-bold text-lg">Sarah Jenkins</p>
                    <p className="text-sm text-slate-500">Arriving at <span className="font-bold text-slate-900">14:00</span></p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Link to="/messages" className="flex-1 py-2 text-center bg-primary-50 text-primary-700 font-bold rounded-lg hover:bg-primary-100 transition-colors text-sm">
                    Message Sarah
                 </Link>
                 <Link to="/care-plans" className="flex-1 py-2 text-center border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm">
                    View Plan
                 </Link>
              </div>
           </div>

           {/* Recent Updates */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <CalendarHeart className="text-primary-600" size={20} /> Recent Updates
              </h3>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <div className="mt-1 w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">Morning Visit Completed</p>
                       <p className="text-xs text-slate-500">Sarah J • 09:30 AM</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">Medication Review Added</p>
                       <p className="text-xs text-slate-500">Dr. Admin • Yesterday</p>
                    </div>
                 </div>
                 <Link to="/messages" className="block text-sm text-primary-600 font-medium hover:underline mt-2">
                    View all messages
                 </Link>
              </div>
           </div>
        </div>
      )}

      {/* --- ADMIN STATS GRID (Hidden for Family/Client) --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Clients" 
            value="124" 
            change="+12% this month" 
            icon={Users} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Visits Today" 
            value="58/62" 
            change="94% Completion" 
            icon={CheckCircle2} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Unassigned Shifts" 
            value="3" 
            change="Action Required" 
            icon={AlertTriangle} 
            color="bg-amber-500" 
          />
          <StatCard 
            title="Staff on Duty" 
            value="28" 
            change="Active now" 
            icon={Clock} 
            color="bg-purple-500" 
          />
        </div>
      )}

      {/* Carer Schedule Preview */}
      {isCarer && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Your Schedule Today</h3>
          <div className="space-y-4">
             {[
               { time: '08:00 - 09:00', client: 'Arthur Dent', type: 'Personal Care', status: 'Next' },
               { time: '09:30 - 11:00', client: 'Tricia McMillan', type: 'Domestic', status: 'Pending' },
               { time: '14:00 - 15:30', client: 'Zaphod B.', type: 'Personal Care', status: 'Pending' },
             ].map((shift, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                     <div className="text-sm font-bold text-slate-500 w-24">{shift.time}</div>
                     <div>
                        <div className="font-bold text-slate-800">{shift.client}</div>
                        <div className="text-xs text-slate-500">{shift.type}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     {shift.status === 'Next' && <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">NEXT</span>}
                  </div>
               </div>
             ))}
          </div>
          <Link to="/rostering" className="block w-full text-center py-3 mt-4 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
            View Full Roster
          </Link>
        </div>
      )}

      {/* --- ADMIN CHARTS (Hidden for Carer & Family) --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Visit Trends (Weekly)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="visits" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="#0ea5e9" strokeWidth={2} dot={{r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Compliance Overview</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 14}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Staff with expired DBS</span>
                 <span className="font-bold text-red-600">2</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Training due (7 days)</span>
                 <span className="font-bold text-amber-600">5</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Feed - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Live Feed & Alerts</h3>
             <button className="text-primary-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-slate-100">
             {[
               { type: 'Late', msg: 'Sarah J. is 15m late for visit at Unit 4', time: '10m ago', color: 'text-red-600 bg-red-50' },
               { type: 'Report', msg: 'Incident Report: Client refusal of medication', time: '45m ago', color: 'text-amber-600 bg-amber-50' },
               { type: 'System', msg: 'Weekly invoices generated successfully', time: '2h ago', color: 'text-green-600 bg-green-50' },
             ].map((item, idx) => (
               <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                 <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.color}`}>{item.type}</span>
                 <p className="flex-1 text-sm text-slate-700">{item.msg}</p>
                 <span className="text-xs text-slate-400">{item.time}</span>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
