import React from 'react'

export default function Progress({ progress = 0, status = '' }) {

    // normalize status so we accept variants like 'In Progress', 'In-Progress', 'in_progress', etc.
    const normalizedStatus = String(status).toLowerCase().replace(/[_-]/g, ' ').trim();

    const getColor = () => {
        if (normalizedStatus === 'in progress' || normalizedStatus === 'inprogress') {
            return 'text-cyan-500 bg-cyan-500 border border-cyan-500/10'
        }

        if (normalizedStatus === 'completed') {
            return 'text-lime-500 bg-lime-500 border border-lime-500/10'
        }

        return 'text-violet-500 bg-violet-500 border border-violet-500/10'
    }

    // ensure progress is a number between 0 and 100
    const pct = Math.max(0, Math.min(100, Number(progress) || 0))

    return (
        <div
            className='w-full bg-gray-200 rounded-full h-1.5'
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
        >
            <div
                className={`${getColor()} h-1.5 rounded-full text-center text-xs font-medium`}
                style={{ width: `${pct}%` }}
            />
        </div>
    )
}
