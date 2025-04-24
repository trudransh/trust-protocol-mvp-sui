
import AppHeader from '@/components/layout/app-header'
import type React from 'react'

export default async function DashBoardlayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <div className="h-dvh w-full">
     
     <AppHeader />
        {children} 
    </div>
  )
}