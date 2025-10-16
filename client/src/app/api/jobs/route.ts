import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    { 
      id: '1', 
      title: 'Software Engineer', 
      company: 'TechCorp',
      location: 'Austin, TX',
      salary: '$120k - $160k',
      posted: '2024-01-15'
    },
    {
      id: '2',
      title: 'Data Analyst',
      company: 'DataCo',
      location: 'Remote',
      salary: '$90k - $120k',
      posted: '2024-01-14'
    }
  ])
}
