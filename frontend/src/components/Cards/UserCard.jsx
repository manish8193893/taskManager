import React from 'react'

export default function UserCard({ userInfo }) {
    // Guard against undefined userInfo
    if (!userInfo) {
        return (
            <div className='user-card p-2'>
                <p className='text-sm text-gray-500'>No user data available</p>
            </div>
        )
    }

    return (
        <>
            <div className='user-card p-2'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <img src={userInfo?.profileImageUrl || ''} alt={`Avatar`} className='w-12 h-12 rounded-full border-2 border-white' />
                        <div className=''>
                            <p className='text-sm font-medium'>{userInfo?.name || 'Unknown'}</p>
                            <p className='text-xs text-gray-500'>{userInfo?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className='flex items-end gap-3 mt-5'>
                    <StatCard
                        label="Pending"
                        count={userInfo?.pendingTasks || 0}
                        status="Pending"
                    />
                    <StatCard
                        label="In Progress"
                        count={userInfo?.inProgressTasks || 0}
                        status="In-Progress"
                    />
                    <StatCard
                        label="Completed"
                        count={userInfo?.completedTasks || 0}
                        status="Completed"
                    />
                </div>
            </div>
        </>
    )
}

const StatCard = ({ label, count, status }) => {

    // Normalize status to handle both 'In Progress' and 'In-Progress'
    const normalizedStatus = String(status).toLowerCase().replace(/[_-]/g, ' ').trim();

    const getStatusTagColor = (status) => {
        if (normalizedStatus === 'in progress') {
            return 'bg-cyan-100 text-cyan-500'
        }

        if (normalizedStatus === 'completed') {
            return 'bg-green-100 text-green-500'
        }

        return 'bg-violet-100 text-violet-500'
    }

    return (
        <div className={`flex-1 text-[10px] font-medium ${getStatusTagColor()} px-4 py-0.5 rounded`}>
            <span className='text-[12px] font-semibold'>{count}</span><br />{label}
        </div>
    )
}
