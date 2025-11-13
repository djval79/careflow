import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Clock, Users, Briefcase, Calendar, MessageSquare, FileText, TrendingUp, Zap } from 'lucide-react';
import { analyticsEngine } from '../lib/analyticsEngine';
import { businessIntelligence } from '../lib/businessIntelligence';

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'approvals' | 'insights'>('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<any>(null);
  const [businessAlerts, setBusinessAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMobileData();
  }, []);

  const loadMobileData = async () => {
    try {
      const realTime = await analyticsEngine.getRealTimeMetrics();
      const alerts = businessIntelligence.getBusinessAlerts();
      
      setQuickStats(realTime);
      setBusinessAlerts(alerts);
      
      // Mock notifications
      setNotifications([
        {
          id: 1,
          type: 'approval',
          title: 'Leave Request Approval',
          message: 'John Smith requested 3 days leave',
          time: '10 min ago',
          priority: 'medium'
        },
        {
          id: 2,
          type: 'interview',
          title: 'Interview Reminder',
          message: 'Technical interview at 2:00 PM',
          time: '30 min ago',
          priority: 'high'
        },
        {
          id: 3,
          type: 'alert',
          title: 'High-Risk Employee',
          message: 'Sarah Chen shows turnover risk indicators',
          time: '1 hour ago',
          priority: 'high'
        }
      ]);
    } catch (error) {
      console.error('Failed to load mobile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const QuickActionCard = ({ icon: Icon, title, value, trend, color }: any) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${color}`} />
        {trend && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {trend === 'up' ? '↗' : '↘'}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const NotificationItem = ({ notification }: { notification: any }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-indigo-500">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
        <span className="text-xs text-gray-500">{notification.time}</span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
      <div className="flex space-x-2">
        {notification.type === 'approval' && (
          <>
            <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-md">
              Approve
            </button>
            <button className="px-3 py-1 bg-red-600 text-white text-xs rounded-md">
              Decline
            </button>
          </>
        )}
        {notification.type === 'interview' && (
          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md">
            View Details
          </button>
        )}
        {notification.type === 'alert' && (
          <button className="px-3 py-1 bg-orange-600 text-white text-xs rounded-md">
            Take Action
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Smartphone className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading mobile dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">HR Mobile</h1>
            <p className="text-indigo-200 text-sm">On-the-go management</p>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📊 Today's Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              icon={Briefcase}
              title="Active Jobs"
              value={quickStats.active_jobs}
              color="text-blue-600"
            />
            <QuickActionCard
              icon={Users}
              title="New Applications"
              value={quickStats.applications_today}
              trend="up"
              color="text-green-600"
            />
            <QuickActionCard
              icon={Calendar}
              title="Pending Interviews"
              value={quickStats.pending_interviews}
              color="text-orange-600"
            />
            <QuickActionCard
              icon={Clock}
              title="Hours Saved"
              value={quickStats.automation_savings_today}
              trend="up"
              color="text-purple-600"
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-t border-gray-200 px-4">
        <div className="flex space-x-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'tasks', label: 'Tasks', icon: FileText },
            { id: 'approvals', label: 'Approvals', icon: Users },
            { id: 'insights', label: 'Insights', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-2 text-center border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 pb-20">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">🔔 Notifications</h2>
            <div className="space-y-3">
              {notifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>

            {businessAlerts && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">⚡ Business Alerts</h2>
                
                {businessAlerts.critical.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-red-700 mb-2">🚨 Critical</h3>
                    {businessAlerts.critical.map((alert: string, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                        <p className="text-sm text-red-800">{alert}</p>
                      </div>
                    ))}
                  </div>
                )}

                {businessAlerts.opportunities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-green-700 mb-2">💡 Opportunities</h3>
                    {businessAlerts.opportunities.map((alert: string, index: number) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <p className="text-sm text-green-800">{alert}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 My Tasks</h2>
            
            {[
              { task: 'Review Sarah Chen\'s performance', priority: 'High', due: 'Today' },
              { task: 'Schedule interviews for Backend Dev role', priority: 'Medium', due: 'Tomorrow' },
              { task: 'Approve Q2 training budget', priority: 'Medium', due: 'This week' },
              { task: 'Update job description for UX Designer', priority: 'Low', due: 'Next week' }
            ].map((task, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{task.task}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-600' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Due: {task.due}</p>
                <button className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">
                  Complete Task
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">✅ Pending Approvals</h2>
            
            {[
              {
                type: 'Leave Request',
                employee: 'John Smith',
                details: '3 days annual leave (Feb 15-17)',
                amount: null
              },
              {
                type: 'Expense Report',
                employee: 'Maria Garcia',
                details: 'Conference attendance',
                amount: '$1,250'
              },
              {
                type: 'Job Offer',
                employee: 'New Candidate',
                details: 'Senior Developer - $95,000/year',
                amount: null
              }
            ].map((approval, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{approval.type}</h3>
                    <p className="text-sm text-gray-600">{approval.employee}</p>
                  </div>
                  {approval.amount && (
                    <span className="font-semibold text-indigo-600">{approval.amount}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{approval.details}</p>
                <div className="flex space-x-2">
                  <button className="flex-1 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
                    Approve
                  </button>
                  <button className="flex-1 py-2 bg-red-600 text-white rounded-md text-sm font-medium">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">🧠 AI Insights</h2>
            
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-2">💡 Key Insight</h3>
              <p className="text-sm text-indigo-100">
                Your recruitment efficiency is 23% above industry average. 
                Consider expanding your referral program to capture this momentum.
              </p>
            </div>

            {[
              {
                title: 'Turnover Risk Alert',
                description: '2 employees showing risk indicators',
                action: 'Review retention strategies',
                color: 'bg-red-50 border-red-200 text-red-800'
              },
              {
                title: 'Hiring Velocity',
                description: 'On track to meet Q2 hiring goals',
                action: 'Maintain current pace',
                color: 'bg-green-50 border-green-200 text-green-800'
              },
              {
                title: 'Budget Efficiency',
                description: '15% under budget this quarter',
                action: 'Consider additional training investment',
                color: 'bg-blue-50 border-blue-200 text-blue-800'
              }
            ].map((insight, index) => (
              <div key={index} className={`border rounded-lg p-4 ${insight.color}`}>
                <h3 className="font-medium text-sm mb-1">{insight.title}</h3>
                <p className="text-sm mb-2 opacity-80">{insight.description}</p>
                <button className="text-sm font-medium underline">
                  {insight.action} →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile App Features Banner */}
      <div className="fixed bottom-4 left-4 right-4 bg-indigo-600 text-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">📱 Get the Mobile App</h3>
            <p className="text-xs text-indigo-200">Manage HR on-the-go</p>
          </div>
          <button className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium">
            Download
          </button>
        </div>
      </div>
    </div>
  );
}