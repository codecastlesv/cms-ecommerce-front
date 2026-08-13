export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, action }: any) {
    return (
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}