import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, X, Send, Eye, RefreshCw, Slack, Video, Mail, Calendar, HardDrive } from 'lucide-react';

interface Integration {
    id: string;
    service_name: string;
    display_name: string;
    is_active: boolean;
    is_connected: boolean;
    last_sync_at: string | null;
}

interface IntegrationLog {
    id: string;
    service_name: string;
    action: string;
    status: string;
    created_at: string;
    duration_ms: number;
    error_message: string | null;
}

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [logs, setLogs] = useState<IntegrationLog[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [testMessage, setTestMessage] = useState('');
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadIntegrations();
        loadLogs();
    }, []);

    async function loadIntegrations() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('integration-manager', {
                body: { action: 'list_integrations' },
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (error) throw error;
            setIntegrations(data?.data || []);
        } catch (error) {
            console.error('Error loading integrations:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadLogs(serviceName?: string) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { data, error } = await supabase.functions.invoke('integration-manager', {
                body: {
                    action: 'get_integration_logs',
                    limit: 50,
                    service_name: serviceName || undefined
                },
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (error) throw error;
            setLogs(data?.data || []);
        } catch (error) {
            console.error('Error loading logs:', error);
        }
    }

    async function testIntegration(serviceName: string) {
        setTesting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let testParams: any = {};

            switch (serviceName) {
                case 'slack':
                    testParams = {
                        action: 'slack_send_message',
                        channel: '#general',
                        text: testMessage || '🧪 Test message from HR Platform!'
                    };
                    break;
                case 'email':
                    testParams = {
                        action: 'email_send',
                        to: testMessage || 'test@example.com',
                        subject: 'Test Email',
                        text: 'This is a test email from the HR Platform.'
                    };
                    break;
                case 'zoom':
                    testParams = {
                        action: 'zoom_create_meeting',
                        topic: 'Test Meeting',
                        start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                        duration: 30
                    };
                    break;
                default:
                    alert(`Test not implemented for ${serviceName}`);
                    return;
            }

            const { data, error } = await supabase.functions.invoke('integration-manager', {
                body: testParams,
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (error) throw error;

            alert(`✅ Test successful! ${serviceName} integration is working.`);
            await loadLogs();
        } catch (error: any) {
            alert(`❌ Test failed: ${error.message}`);
        } finally {
            setTesting(false);
            setTestMessage('');
        }
    }

    const getServiceIcon = (serviceName: string) => {
        switch (serviceName) {
            case 'slack': return <Slack className="w-6 h-6" />;
            case 'zoom': return <Video className="w-6 h-6" />;
            case 'email': return <Mail className="w-6 h-6" />;
            case 'calendar': return <Calendar className="w-6 h-6" />;
            case 'storage': return <HardDrive className="w-6 h-6" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-600 mt-2">Connect third-party services to enhance your HR workflow</p>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <div key={integration.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-3 rounded-lg ${integration.is_connected ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                    {getServiceIcon(integration.service_name)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{integration.display_name}</h3>
                                    <p className="text-sm text-gray-500">{integration.service_name}</p>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${integration.is_connected ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ${integration.is_connected ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    {integration.is_connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            {integration.last_sync_at && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Last sync:</span>
                                    <span className="text-gray-900">
                                        {new Date(integration.last_sync_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedService(integration.service_name);
                                    loadLogs(integration.service_name);
                                }}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Logs
                            </button>
                            {integration.is_connected && (
                                <button
                                    onClick={() => testIntegration(integration.service_name)}
                                    disabled={testing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {integrations.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <p>No integrations configured yet.</p>
                        <p className="text-sm mt-2">Deploy the integration database schema to get started.</p>
                    </div>
                )}
            </div>

            {/* Test Integration Modal */}
            {selectedService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">
                                {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} Logs
                            </h2>
                            <button
                                onClick={() => setSelectedService(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {logs.filter(log => log.service_name === selectedService).map((log) => (
                                <div key={log.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {log.status === 'success' ? (
                                                <Check className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-600" />
                                            )}
                                            <span className="font-medium">{log.action}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {log.duration_ms && (
                                        <p className="text-sm text-gray-600">
                                            Duration: {log.duration_ms.toFixed(2)}ms
                                        </p>
                                    )}
                                    {log.error_message && (
                                        <p className="text-sm text-red-600 mt-2">
                                            Error: {log.error_message}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {logs.filter(log => log.service_name === selectedService).length === 0 && (
                                <p className="text-center py-8 text-gray-500">No logs found</p>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedService(null)}
                            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
