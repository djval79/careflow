import React, { useState } from 'react';
import { ExternalLink, CheckCircle, Bell, RefreshCw } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    source: 'CQC' | 'Home Office' | 'Skills for Care';
    date: string;
    url: string;
    summary: string;
    acknowledged: boolean;
}

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        title: 'Right to Work Checks: Updated Guidance',
        source: 'Home Office',
        date: '2024-02-15',
        url: 'https://www.gov.uk/government/publications/right-to-work-checks-employers-guide',
        summary: 'Updated guidance on using Identity Service Providers (IDSPs) and digital checks.',
        acknowledged: false
    },
    {
        id: '2',
        title: 'CQC Single Assessment Framework',
        source: 'CQC',
        date: '2024-01-10',
        url: 'https://www.cqc.org.uk/assessment/single-assessment-framework',
        summary: 'Details on the new single assessment framework rollout and quality statements.',
        acknowledged: true
    },
    {
        id: '3',
        title: 'International Recruitment Fund',
        source: 'Skills for Care',
        date: '2024-03-01',
        url: 'https://www.skillsforcare.org.uk/International-recruitment',
        summary: 'New funding available for adult social care providers to support international recruitment.',
        acknowledged: false
    }
];

export default function RegulatoryNewsWidget() {
    const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);
    const [loading, setLoading] = useState(false);

    const handleAcknowledge = (id: string) => {
        setNews(prev => prev.map(item =>
            item.id === id ? { ...item, acknowledged: true } : item
        ));
    };

    const handleRefresh = () => {
        setLoading(true);
        // Simulate fetch
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-600" />
                    Regulatory Updates
                </h3>
                <button
                    onClick={handleRefresh}
                    className={`text-gray-500 hover:text-cyan-600 transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {news.map(item => (
                    <div key={item.id} className={`p-4 hover:bg-gray-50 transition-colors ${item.acknowledged ? 'opacity-75' : ''}`}>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.source === 'CQC' ? 'bg-purple-100 text-purple-800' :
                                            item.source === 'Home Office' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {item.source}
                                    </span>
                                    <span className="text-xs text-gray-500">{item.date}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 hover:underline flex items-center gap-1">
                                        {item.title}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                            </div>

                            <button
                                onClick={() => handleAcknowledge(item.id)}
                                disabled={item.acknowledged}
                                className={`flex-shrink-0 p-1 rounded-full transition-colors ${item.acknowledged
                                        ? 'text-green-500 bg-green-50 cursor-default'
                                        : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                    }`}
                                title={item.acknowledged ? "Acknowledged" : "Mark as Read"}
                            >
                                <CheckCircle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <a href="#" className="text-xs text-cyan-600 hover:text-cyan-800 font-medium">
                    View All Updates
                </a>
            </div>
        </div>
    );
}
