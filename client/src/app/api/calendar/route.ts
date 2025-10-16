import { NextResponse } from 'next/server'

export async function GET() {
  // Mock calendar events for demo
  return NextResponse.json([
    { id: '1', title: 'Interview - TechCorp', date: '2024-01-20', type: 'interview' },
    { id: '2', title: 'Resume Review', date: '2024-01-21', type: 'review' },
    { id: '3', title: 'Job Fair', date: '2024-01-25', type: 'event' }
  ])
}
