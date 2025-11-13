import React, { useEffect, useState } from 'react';
import { Zap, Play, Pause, Settings, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AutomationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAutomationData();
  }, []);

  async function loadAutomationData() {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      const { data: rulesData } = await supabase.functions.invoke('automation-engine', {
        body: { action: 'GET_RULES', data: {} },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      const { data: logs } = await supabase
        .from('automation_execution_logs')
        .select('*')
        .order('execution_timestamp', { ascending: false })
        .limit(20);

      setRules(rulesData?.data || []);
      setExecutionLogs(logs || []);
    } catch (error) {
      console.error('Error loading automation data:', error);
    }
  }

  async function handleToggleRule(ruleId: string, currentStatus: boolean) {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'TOGGLE_RULE',
          data: {
            rule_id: ruleId,
            is_active: !currentStatus
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      await loadAutomationData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Failed to toggle rule');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRule() {
    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      const ruleName = prompt('Enter rule name:');
      if (!ruleName) return;

      await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'CREATE_RULE',
          data: {
            rule_name: ruleName,
            rule_type: 'compliance_check',
            trigger_event: 'document_expiry',
            trigger_conditions: JSON.stringify({ days_before_expiry: 30 }),
            action_type: 'send_notification',
            action_config: JSON.stringify({ notification_type: 'email' }),
            priority: 5
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      alert('Automation rule created successfully!');
      await loadAutomationData();
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule');
    } finally {
      setLoading(false);
    }
  }

  const activeRules = rules.filter(r => r.is_active).length;
  const totalExecutions = rules.reduce((sum, r) => sum + (r.execution_count || 0), 0);
  const successfulExecutions = rules.reduce((sum, r) => sum + (r.success_count || 0), 0);
  const successRate = totalExecutions > 0 ? ((successfulExecutions / totalExecutions) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-gray-600 mt-1">Workflow Automation and Rule Management</p>
        </div>
        <button
          onClick={handleCreateRule}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 mr-2" />
          Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rules</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{rules.length}</p>
              <p className="text-xs text-green-600 mt-1">{activeRules} Active</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalExecutions}</p>
              <p className="text-xs text-blue-600 mt-1">All Time</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{successRate}%</p>
              <p className="text-xs text-green-600 mt-1">{successfulExecutions} Successful</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Logs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{executionLogs.length}</p>
              <p className="text-xs text-gray-600 mt-1">Last 20 Executions</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
          <p className="text-sm text-gray-600 mt-1">Configure and manage automation workflows</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No automation rules yet</p>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Your First Rule
                </button>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-semibold text-gray-900">{rule.rule_name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                          {rule.rule_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Trigger Event</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{rule.trigger_event.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Action Type</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{rule.action_type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Executions</p>
                          <p className="text-sm font-medium text-gray-900">{rule.execution_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Success Rate</p>
                          <p className="text-sm font-medium text-gray-900">
                            {rule.execution_count > 0 
                              ? ((rule.success_count / rule.execution_count) * 100).toFixed(0)
                              : 0}%
                          </p>
                        </div>
                      </div>
                      {rule.last_executed_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last executed: {new Date(rule.last_executed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                        disabled={loading}
                        className={`p-2 rounded-lg ${
                          rule.is_active 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        } disabled:opacity-50`}
                        title={rule.is_active ? 'Pause Rule' : 'Activate Rule'}
                      >
                        {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                        title="Configure Rule"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Execution Logs</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executionLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(log.execution_timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">{log.trigger_event.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {log.execution_status === 'success' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                            <span className="text-sm text-green-600">Success</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600 mr-1" />
                            <span className="text-sm text-red-600">Failed</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.execution_duration_ms ? `${log.execution_duration_ms}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
