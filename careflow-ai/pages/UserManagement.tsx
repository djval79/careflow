
import React, { useState } from 'react';
import { 
  Users, Shield, Search, Plus, MoreHorizontal, Lock, 
  Unlock, Activity, AlertTriangle, CheckCircle2, Sparkles, Loader2
} from 'lucide-react';
import { MOCK_SYSTEM_USERS, MOCK_SECURITY_LOGS } from '../services/mockData';
import { SystemUser, SecurityLog, SecurityAnalysis } from '../types';
import { analyzeSecurityLogs } from '../services/geminiService';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users');
  const [users, setUsers] = useState<SystemUser[]>(MOCK_SYSTEM_USERS);
  const [logs, setLogs] = useState<SecurityLog[]>(MOCK_SECURITY_LOGS);
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);

  // Handlers
  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { 
      ...u, 
      status: u.status === 'Active' ? 'Suspended' : 'Active' 
    } : u));
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    setAnalysis(null);
    
    // Convert logs to string for analysis
    const logsStr = logs.map(l => `[${l.timestamp}] ${l.user} - ${l.action}: ${l.details} (${l.severity})`).join('\n');
    
    try {
      const result = await analyzeSecurityLogs(logsStr);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAuditing(false);
    }
  };

  // Render Users Tab
  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
             <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
             />
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2 text-sm">
             <Plus size={16} /> Add User
          </button>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                   <th className="px-6 py-3 font-medium">User</th>
                   <th className="px-6 py-3 font-medium">Role</th>
                   <th className="px-6 py-3 font-medium">Last Login</th>
                   <th className="px-6 py-3 font-medium">Status</th>
                   <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                   <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                               {u.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-slate-900">{u.name}</p>
                               <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                            {u.role}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{u.lastLogin}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit
                            ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 
                              u.status === 'Suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                         `}>
                            {u.status === 'Active' ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                            {u.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-1.5 rounded border transition-colors ${
                                 u.status === 'Active' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                              title={u.status === 'Active' ? 'Suspend' : 'Activate'}
                            >
                               {u.status === 'Active' ? <Lock size={16}/> : <Unlock size={16}/>}
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100">
                               <MoreHorizontal size={16}/>
                            </button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  // Render Security Tab
  const renderSecurity = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="lg:col-span-2 space-y-6">
          {/* Analysis Card */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
             <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                   <h3 className="font-bold text-lg flex items-center gap-2">
                      <Sparkles className="text-purple-400" size={20}/> AI Security Auditor
                   </h3>
                   <p className="text-slate-400 text-sm">Analyze access patterns for anomalies.</p>
                </div>
                {!analysis && (
                   <button 
                     onClick={handleAudit}
                     disabled={isAuditing}
                     className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                   >
                      {isAuditing ? <Loader2 className="animate-spin" size={16}/> : <Activity size={16}/>}
                      Run Audit
                   </button>
                )}
             </div>

             {analysis ? (
                <div className="space-y-4 relative z-10 animate-in fade-in">
                   <div className="flex items-center gap-3">
                      <div className={`text-3xl font-bold px-3 py-1 rounded border-2 
                         ${analysis.threatLevel === 'High' ? 'text-red-400 border-red-400 bg-red-900/20' : 
                           analysis.threatLevel === 'Medium' ? 'text-amber-400 border-amber-400 bg-amber-900/20' : 
                           'text-green-400 border-green-400 bg-green-900/20'}
                      `}>
                         {analysis.threatLevel}
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Threat Level Detected</span>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                         <h4 className="font-bold text-red-300 mb-2 text-sm uppercase">Suspicious Activity</h4>
                         <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                            {analysis.suspiciousActivities.map((act, i) => <li key={i}>{act}</li>)}
                         </ul>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                         <h4 className="font-bold text-blue-300 mb-2 text-sm uppercase">Recommendations</h4>
                         <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                            {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                         </ul>
                      </div>
                   </div>
                   
                   <button onClick={() => setAnalysis(null)} className="text-xs text-slate-500 hover:text-white underline mt-2">Reset Analysis</button>
                </div>
             ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg text-slate-600">
                   Awaiting Audit Run...
                </div>
             )}
          </div>

          {/* Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">Recent Access Logs</h3>
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                   <tr>
                      <th className="px-6 py-3 font-medium">Time</th>
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">IP Address</th>
                      <th className="px-6 py-3 font-medium text-right">Severity</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                         <td className="px-6 py-3 text-slate-500 text-xs font-mono">{log.timestamp}</td>
                         <td className="px-6 py-3 font-bold text-slate-800">{log.user}</td>
                         <td className="px-6 py-3 text-slate-700">{log.action} <span className="text-slate-400 text-xs ml-1">({log.details})</span></td>
                         <td className="px-6 py-3 text-slate-500 font-mono text-xs">{log.ipAddress}</td>
                         <td className="px-6 py-3 text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase 
                               ${log.severity === 'Critical' ? 'bg-red-100 text-red-700' : 
                                 log.severity === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}
                            `}>
                               {log.severity}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* Stats Side Panel */}
       <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4">Active Sessions</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-600">Web Portal</span>
                   <span className="font-bold text-green-600">12</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-600">Mobile App</span>
                   <span className="font-bold text-green-600">45</span>
                </div>
                <div className="w-full bg-slate-100 h-px my-2"></div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-600">Failed Logins (24h)</span>
                   <span className="font-bold text-red-600">3</span>
                </div>
             </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
             <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Shield size={18}/> Policy Enforcer</h3>
             <p className="text-sm text-blue-800 mb-4">
                Password rotation is enforced every 90 days. MFA is enabled for Admin accounts.
             </p>
             <button className="text-blue-600 text-xs font-bold uppercase hover:underline">Configure Policies</button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Users & Security</h1>
             <p className="text-slate-500 text-sm">Manage system access and monitor security threats.</p>
          </div>
       </div>

       <div className="flex p-1 bg-slate-200 rounded-xl w-fit">
          <button 
             onClick={() => setActiveTab('users')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
             <Users size={16} /> User Accounts
          </button>
          <button 
             onClick={() => setActiveTab('security')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
             <Shield size={16} /> Security Audit
          </button>
       </div>

       {activeTab === 'users' && renderUsers()}
       {activeTab === 'security' && renderSecurity()}
    </div>
  );
};

export default UserManagement;
