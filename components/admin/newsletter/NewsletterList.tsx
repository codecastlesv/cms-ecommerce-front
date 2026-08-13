'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Mail, CheckCircle } from 'lucide-react';

export default function NewsletterList() {
    const [subscribers, setSubscribers] = useState<any[]>([]);

    useEffect(() => {
        api.get('/admin/newsletter').then(({ data }) => setSubscribers(data.data));
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Suscriptores Newsletter</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Origen</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {subscribers.map((sub: any) => (
                            <tr key={sub.id}>
                                <td className="px-6 py-4 font-bold text-slate-700">{sub.email}</td>
                                <td className="px-6 py-4 text-slate-500">{sub.source}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center text-green-600 text-xs font-bold uppercase">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Suscrito
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}