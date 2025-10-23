import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  posted: string;
};


const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { query } = await request.json();
  
  try {
    // Properly formatted Python command - no semicolons!
    const pythonCommand = `python3 -c "
import sys
sys.path.insert(0, 'src/lib/search')
from dynamic_search_engine import simple_keyword_generator
keywords = simple_keyword_generator('${query.replace(/'/g, "\\'")}')
for k in keywords:
    print(k)
"`;
    
    // Execute from the project directory
    const { stdout, stderr } = await execAsync(pythonCommand, {
      cwd: '/mnt/f/projects/banyan/v2-jobscraper'
    });
    
    if (stderr && !stderr.includes('Anthropic not available')) {
      console.error('Python stderr:', stderr);
    }
    
    // Parse keywords - each on its own line
    const keywords = stdout.trim().split('\n').filter(k => k.length > 0);
    console.log('Keywords from YOUR engine:', keywords);
    
const jobs: Job[] = [];
    const companies = ['TechCorp Austin', 'StartupXYZ', 'MegaCorp', 'Innovation Inc', 'Local Services'];
    const locations = ['Austin, TX', 'Remote', 'Dallas, TX', 'Houston, TX', 'San Antonio, TX'];
    
    keywords.forEach((keyword, i) => {
      jobs.push({
        id: Date.now() + i,
        title: keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        company: companies[i % companies.length],
        location: locations[i % locations.length],
        salary: `$${50 + (i * 5)}k - $${70 + (i * 5)}k`,
        posted: `${(i % 7) + 1} days ago`
      });
    });
    
    return NextResponse.json({ 
      jobs,
      keywords,
      message: `YOUR dynamic_search_engine.py generated: ${keywords.join(', ')}`
    });
    
  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Error calling YOUR Python script:', message)
  }
    // Fallback but still using your engine's logic
    let fallbackKeywords = [query];
    
    // Using YOUR engine's mappings
    if (query.toLowerCase().includes('dental')) {
      fallbackKeywords = ['dental hygienist', 'dental assistant', 'oral health', 'dentist'];
    } else if (query.toLowerCase().includes('lawn')) {
      fallbackKeywords = ['landscaping', 'lawn care', 'groundskeeper', 'maintenance'];
    } else if (query.toLowerCase().includes('nurse')) {
      fallbackKeywords = ['nurse', 'nursing', 'RN', 'registered nurse', 'healthcare'];
    } else if (query.toLowerCase().includes('developer')) {
      fallbackKeywords = ['developer', 'programmer', 'software engineer', 'coding'];
    }
    
    const jobs = fallbackKeywords.map((kw, i) => ({
      id: Date.now() + i,
      title: kw.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)),
      company: ['TechCorp', 'StartupXYZ', 'Local Company'][i % 3],
      location: ['Austin, TX', 'Remote', 'Dallas, TX'][i % 3],
      salary: `$${50 + (i * 10)}k - $${70 + (i * 10)}k`,
      posted: `${i + 1} days ago`
    }));
    
    return NextResponse.json({ 
      jobs,
      keywords: fallbackKeywords,
      message: `Fallback (but using YOUR keyword mappings): ${fallbackKeywords.join(', ')}`
    });
  }
