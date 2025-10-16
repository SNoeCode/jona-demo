// app/actions/saveJob.ts
// 'use server';

// import { createServerClient } from '@supabase/ssr';
// import type { Database } from '@/types/database';
// import { cookies } from 'next/headers';

// export async function saveJob(job_id: string, value: boolean) {
//   const cookieStore = cookies();

//   const supabase = createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: () => cookieStore.getAll(),
//         setAll: (cookiesToSet) => {
//           cookiesToSet.forEach(({ name, value, options }) => {
//             cookieStore.set(name, value, options);
//           });
//         },
//       },
//     }
//   );

//   const {
//     data: { session },
//     error,
//   } = await supabase.auth.getSession();

//   if (error || !session?.access_token) {
//     throw new Error('Unauthorized: No valid session found');
//   }

//   const accessToken = session.access_token;

//   const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/jobs/save`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${accessToken}`,
//     },
//     body: JSON.stringify({
//       job_id,
//       action: 'saved',
//       value,
//     }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     throw new Error(`Failed to save job: ${errorText}`);
//   }

//   return await response.json();
// }