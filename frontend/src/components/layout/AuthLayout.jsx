import React from 'react'
import UI_IMG from '../../assets/images/front.png'

const AuthLayout = ({ children }) => {
    return (
        <>
            <div className='flex'>
                <div className='w-screen h-screen md:w-[65vw] px-12 pt-8 pb-12'>
                    <h2 className='text-lg font-medium text-black'>Task Manager</h2>
                    {children}
                </div>

                <div className='hidden md:flex w-[35vw] h-screen items-center justify-center bg-blue-50 bg-[url("/bg.jpg")] bg-cover bg-no-repeat bg-center overflow-hidden p-2'>
                    <img src={UI_IMG} alt="Card" className='w-74 lg:w-[90%]' />
                </div>

            </div>
        </>
    )
}

export default AuthLayout
