// client/src/services/scraperApiClient.ts
// import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
// import type { ScraperRequest, ScraperResponse } from '@/types/admin';

// interface FastAPIClient {
//   runCareerBuilder: (config: ScraperRequest) => Promise<ScraperResponse>;
//   runIndeed: (config: ScraperRequest) => Promise<ScraperResponse>;
//   runZipRecruiter: (config: ScraperRequest) => Promise<ScraperResponse>;
//   runTekSystems: (config: ScraperRequest) => Promise<ScraperResponse>;
//   runDice: (config: ScraperRequest) => Promise<ScraperResponse>;
//   runAllScrapers: (config: ScraperRequest) => Promise<ScraperResponse>;
//   getScraperStatus: () => Promise<any>;
//   getScrapingLogs: () => Promise<any>;
// }

// class ScraperApiClient implements FastAPIClient {
//   private client: AxiosInstance;
//   private baseURL: string;

//   constructor() {
//     this.baseURL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
    
//     this.client = axios.create({
//       baseURL: this.baseURL,
//       timeout: 600000, // 10 minutes timeout for scraping operations
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // Add request interceptor for authentication
//     this.client.interceptors.request.use(
//       (config) => {
//         // Add auth token from Next.js session or localStorage
//         const token = this.getAuthToken();
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => Promise.reject(error)
//     );

//     // Add response interceptor for error handling
//     this.client.interceptors.response.use(
//       (response) => response,
//       (error: AxiosError) => {
//         console.error('FastAPI Client Error:', error);
//         return Promise.reject(this.handleError(error));
//       }
//     );
//   }

//   private getAuthToken(): string | null {
//     // Get token from Next.js auth system (adjust based on your auth implementation)
//     if (typeof window !== 'undefined') {
//       // Client-side: get from localStorage or session
//       return localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token');
//     } else {
//       // Server-side: get from environment or request context
//       return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
//     }
//   }

//   private handleError(error: AxiosError): ScraperResponse {
//     const response = error.response;
//     const message =
//   (response?.data as { detail?: string })?.detail ||
//   error.message ||
//   'Unknown error occurred';
//     return {
//       success: false,
//       error: message,
//       status: 'failed',
//       jobs_found: 0,
//       jobs_saved: 0,
//     };
//   }

//   private async makeRequest<T>(
//     endpoint: string, 
//     config: ScraperRequest,
//     method: 'GET' | 'POST' = 'POST'
//   ): Promise<T> {
//     const requestConfig: AxiosRequestConfig = {
//       method,
//       url: endpoint,
//     };

//     if (method === 'POST') {
//       requestConfig.data = {
//         location: config.location || 'remote',
//         days: config.days || 15,
//         keywords: config.keywords || [],
//         sites: config.sites || [],
//         priority: config.priority || 'medium',
//         debug: config.debug || false,
//         user_id: config.user_id,
//         admin_user_id: config.admin_user_id,
//         admin_email: config.admin_email,
//       };
//     } else if (method === 'GET') {
//       requestConfig.params = {
//         location: config.location || 'remote',
//         days: config.days || 15,
//         debug: config.debug || false,
//       };
//     }

//     const response = await this.client.request(requestConfig);
//     return response.data;
//   }

//   async runCareerBuilder(config: ScraperRequest): Promise<ScraperResponse> {
//     try {
//       const result = await this.makeRequest<any>('/careerbuilder', config);
      
//       return {
//         success: true,
//         scraper_name: 'careerbuilder',
//         jobs_found: result.career_builder_crawler || 0,
//         jobs_count: result.career_builder_crawler || 0,
//         status: result.status || 'completed',
//         message: `Found ${result.career_builder_crawler || 0} jobs from CareerBuilder`,
//       };
//     } catch (error) {
//       console.error('CareerBuilder scraper error:', error);
//       return this.handleError(error as AxiosError);
//     }
//   }

//   async runIndeed(config: ScraperRequest): Promise<ScraperResponse> {
//     try {
//       const result = await this.makeRequest<any>('/indeed', config);
      
//       return {
//         success: true,
//         scraper_name: 'indeed',
//         jobs_found: result.indeed_jobs || 0,
//         jobs_count: result.indeed_jobs || 0,
//         status: result.status || 'completed',
//         message: `Found ${result.indeed_jobs || 0} jobs from Indeed`,
//       };
//     } catch (error) {
//       console.error('Indeed scraper error:', error);
//       return this.handleError(error as AxiosError);
//     }
//   }

//   async runZipRecruiter(config: ScraperRequest): Promise<ScraperResponse> {
//     try {
//       const result = await this.makeRequest<any>('/ziprecruiter', config);
      
//       return {
//         success: true,
//         scraper_name: 'ziprecruiter',
//         jobs_found: result.ziprecruiter_jobs || 0,
//         jobs_count: result.ziprecruiter_jobs || 0,
//         status: result.status || 'completed',
//         message: `Found ${result.ziprecruiter_jobs || 0} jobs from ZipRecruiter`,
//       };
//     } catch (error) {
//       console.error('ZipRecruiter scraper error:', error);
//       return this.handleError(error as AxiosError);
//     }
//   }

//   async runTekSystems(config: ScraperRequest): Promise<ScraperResponse> {
//     try {
//       const result = await this.makeRequest<any>('/teksystems', config);
      
//       return {
//         success: true,
//         scraper_name: 'teksystems',
//         jobs_found: result.teksystems_jobs || 0,
//         jobs_count: result.teksystems_jobs || 0,
//         status: result.status || 'completed',
//         message: `Found ${result.teksystems_jobs || 0} jobs from TekSystems`,
//       };
//     } catch (error) {
//       console.error('TekSystems scraper error:', error);
//       return this.handleError(error as AxiosError);
//     }
//   }

//   async runDice(config: ScraperRequest): Promise<ScraperResponse> {
//     try {
//       const result = await this.makeRequest<any>('/dice', config);
      
//       return {
//         success: true,
//         scraper_name: 'dice',
//         jobs_found: result.dice_jobs || 0,
//         jobs_count: result.dice_jobs || 0,
//         status: result.status || 'completed',
//         message: `Found ${result.dice_jobs || 0} jobs from Dice`,
//       };
//     } catch (error) {
//       console.error('Dice scraper error:', error);
//       return this.handleError(error as AxiosError);
//     }
//   }

//   async runAllScrapers(config: ScraperRequest): Promise<ScraperResponse> {
//     try {
//       const result = await this.makeRequest<any>('/all-scrapers', config);
      
//       return {
//         success: true,
//         scraper_name: 'all',
//         jobs_found: result.total_jobs || 0,
//         jobs_count: result.total_jobs || 0,
//         status: result.status || 'completed',
//         message: `Completed all scrapers. Total jobs: ${result.total_jobs || 0}`,
//         output: JSON.stringify(result, null, 2),
//       };
//     } catch (error) {
//       console.error('All scrapers error:', error);
//       return this.handleError(error as AxiosError);
//     }
//   }

//   async getScraperStatus(): Promise<any> {
//     try {
//       const response = await this.client.get('/status');
//       return response.data;
//     } catch (error) {
//       console.error('Status check error:', error);
//       return { status: 'error', message: 'Failed to get status' };
//     }
//   }

//   async getScrapingLogs(): Promise<any> {
//     try {
//       const response = await this.client.get('/logs');
//       return response.data;
//     } catch (error) {
//       console.error('Logs fetch error:', error);
//       return [];
//     }
//   }
// }

// // Export singleton instance
// export const scraperApiClient = new ScraperApiClient();

// // Export individual functions for easier use
// export const {
//   runCareerBuilder,
//   runIndeed,
//   runZipRecruiter,
//   runTekSystems,
//   runDice,
//   runAllScrapers,
//   getScraperStatus,
//   getScrapingLogs,
// } = scraperApiClient;


// import axios, { AxiosError } from 'axios';
// import type { ScraperRequest, ScraperResponse } from '@/types/admin';

// const BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// const getAuthToken = (): string | null => {
//   if (typeof window !== 'undefined') {
//     return localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token');
//   }
//   return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
// };

// const handleError = (error: AxiosError): ScraperResponse => {
//   const response = error.response;
//   const message =
//     (response?.data as { detail?: string })?.detail ||
//     error.message ||
//     'Unknown error occurred';

//   return {
//     success: false,
//     error: message,
//     status: 'failed',
//     jobs_found: 0,
//     jobs_saved: 0,
//   };
// };

// const makeRequest = async <T>(
//   endpoint: string,
//   config: ScraperRequest,
//   method: 'GET' | 'POST' = 'POST'
// ): Promise<T> => {
//   const token = getAuthToken();

//   const headers = {
//     'Content-Type': 'application/json',
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };

//   const axiosConfig = {
//     method,
//     url: `${BASE_URL}${endpoint}`,
//     headers,
//     ...(method === 'POST'
//       ? {
//           data: {
//             location: config.location || 'remote',
//             days: config.days || 15,
//             keywords: config.keywords || [],
//             sites: config.sites || [],
//             priority: config.priority || 'medium',
//             debug: config.debug || false,
//             user_id: config.user_id,
//             admin_user_id: config.admin_user_id,
//             admin_email: config.admin_email,
//           },
//         }
//       : {
//           params: {
//             location: config.location || 'remote',
//             days: config.days || 15,
//             debug: config.debug || false,
//           },
//         }),
//   };

//   const response = await axios.request(axiosConfig);
//   return response.data;
// };

// // Individual scraper functions
// export const runCareerBuilder = async (config: ScraperRequest): Promise<ScraperResponse> => {
//   try {
//     const result = await makeRequest<any>('/careerbuilder', config);
//     return {
//       success: true,
//       scraper_name: 'careerbuilder',
//       jobs_found: result.career_builder_crawler || 0,
//       jobs_count: result.career_builder_crawler || 0,
//       status: result.status || 'completed',
//       message: `Found ${result.career_builder_crawler || 0} jobs from CareerBuilder`,
//     };
//   } catch (error) {
//     return handleError(error as AxiosError);
//   }
// };

// export const runSnagajob = async (config: ScraperRequest): Promise<ScraperResponse> => {
//   try {
//     const result = await makeRequest<any>('/snag-playwright', config);
//     return {
//       success: true,
//       scraper_name: 'snagajob',
//       jobs_found: result.snagajob_jobs || 0,
//       jobs_count: result.snagajob_jobs || 0,
//       status: result.status || 'completed',
//       message: `Found ${result.snagajob_jobs || 0} jobs from Snagajob`,
//     };
//   } catch (error) {
//     return handleError(error as AxiosError);
//   }
// };

// // Add other scrapers similarly...
// export const runIndeed = async (config: ScraperRequest): Promise<ScraperResponse> => {
//   try {
//     const result = await makeRequest<any>('/indeed', config);
//     return {
//       success: true,
//       scraper_name: 'indeed',
//       jobs_found: result.indeed_jobs || 0,
//       jobs_count: result.indeed_jobs || 0,
//       status: result.status || 'completed',
//       message: `Found ${result.indeed_jobs || 0} jobs from Indeed`,
//     };
//   } catch (error) {
//     return handleError(error as AxiosError);
//   }
// };

// // Utility endpoints
// export const getScraperStatus = async (): Promise<any> => {
//   try {
//     const response = await axios.get(`${BASE_URL}/status`);
//     return response.data;
//   } catch (error) {
//     return { status: 'error', message: 'Failed to get status' };
//   }
// };

// export const getScrapingLogs = async (): Promise<any> => {
//   try {
//     const response = await axios.get(`${BASE_URL}/logs`);
//     return response.data;
//   } catch (error) {
//     return [];
//   }
// };


import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';
import type { ScraperRequest, ScraperResponse } from '@/types/admin/admin';

const BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('supabase_token') || sessionStorage.getItem('supabase_token');
  }
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
};

const handleError = (error: AxiosError): ScraperResponse => {
  const response = error.response;
  const message =
    (response?.data as { detail?: string })?.detail ||
    error.message ||
    'Unknown error occurred';

  return {
    success: false,
    error: message,
    status: 'failed',
    jobs_found: 0,
    // jobs_saved: 0,
  };
};

const createClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 600000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      console.error('FastAPI Client Error:', error);
      return Promise.reject(handleError(error));
    }
  );

  return client;
};

const makeRequest = async <T>(
  endpoint: string,
  config: ScraperRequest,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> => {
  const client = createClient();

  const requestConfig: AxiosRequestConfig = {
    method,
    url: endpoint,
  };

  if (method === 'POST') {
    requestConfig.data = {
      location: config.location || 'remote',
      days: config.days || 15,
      keywords: config.keywords || [],
      sites: config.sites || [],
      priority: config.priority || 'medium',
      debug: config.debug || false,
      user_id: config.user_id,
      admin_user_id: config.admin_user_id,
      admin_email: config.admin_email,
    };
  } else {
    requestConfig.params = {
      location: config.location || 'remote',
      days: config.days || 15,
      debug: config.debug || false,
    };
  }

  const response = await client.request(requestConfig);
  return response.data;
};

class ScraperApiClient {
  runCareerBuilder = async (config: ScraperRequest): Promise<ScraperResponse> => {
    try {
      const result = await makeRequest<any>('/careerbuilder', config);
      return {
        success: true,
        scraper_name: 'careerbuilder',
        jobs_found: result.career_builder_crawler || 0,
        jobs_count: result.career_builder_crawler || 0,
        status: result.status || 'completed',
        message: `Found ${result.career_builder_crawler || 0} jobs from CareerBuilder`,
      };
    } catch (error) {
      return handleError(error as AxiosError);
    }
  };

  runIndeed = async (config: ScraperRequest): Promise<ScraperResponse> => {
    try {
      const result = await makeRequest<any>('/indeed', config);
      return {
        success: true,
        scraper_name: 'indeed',
        jobs_found: result.indeed_jobs || 0,
        jobs_count: result.indeed_jobs || 0,
        status: result.status || 'completed',
        message: `Found ${result.indeed_jobs || 0} jobs from Indeed`,
      };
    } catch (error) {
      return handleError(error as AxiosError);
    }
  };

  runZipRecruiter = async (config: ScraperRequest): Promise<ScraperResponse> => {
    try {
      const result = await makeRequest<any>('/ziprecruiter', config);
      return {
        success: true,
        scraper_name: 'ziprecruiter',
        jobs_found: result.ziprecruiter_jobs || 0,
        jobs_count: result.ziprecruiter_jobs || 0,
        status: result.status || 'completed',
        message: `Found ${result.ziprecruiter_jobs || 0} jobs from ZipRecruiter`,
      };
    } catch (error) {
      return handleError(error as AxiosError);
    }
  };

  runTekSystems = async (config: ScraperRequest): Promise<ScraperResponse> => {
    try {
      const result = await makeRequest<any>('/teksystems', config);
      return {
        success: true,
        scraper_name: 'teksystems',
        jobs_found: result.teksystems_jobs || 0,
        jobs_count: result.teksystems_jobs || 0,
        status: result.status || 'completed',
        message: `Found ${result.teksystems_jobs || 0} jobs from TekSystems`,
      };
    } catch (error) {
      return handleError(error as AxiosError);
    }
  };

  runDice = async (config: ScraperRequest): Promise<ScraperResponse> => {
    try {
      const result = await makeRequest<any>('/dice', config);
      return {
        success: true,
        scraper_name: 'dice',
        jobs_found: result.dice_jobs || 0,
        jobs_count: result.dice_jobs || 0,
        status: result.status || 'completed',
        message: `Found ${result.dice_jobs || 0} jobs from Dice`,
      };
    } catch (error) {
      return handleError(error as AxiosError);
    }
  };

  runAllScrapers = async (config: ScraperRequest): Promise<ScraperResponse> => {
    try {
      const result = await makeRequest<any>('/all-scrapers', config);
      return {
        success: true,
        scraper_name: 'all',
        jobs_found: result.total_jobs || 0,
        jobs_count: result.total_jobs || 0,
        status: result.status || 'completed',
        message: `Completed all scrapers. Total jobs: ${result.total_jobs || 0}`,
        output: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      return handleError(error as AxiosError);
    }
  };

  getScraperStatus = async (): Promise<any> => {
    try {
      const client = createClient();
      const response = await client.get('/status');
      return response.data;
    } catch (error) {
      return { status: 'error', message: 'Failed to get status' };
    }
  };

  getScrapingLogs = async (): Promise<any> => {
    try {
      const client = createClient();
      const response = await client.get('/logs');
      return response.data;
    } catch (error) {
      return [];
    }
  };
}

export const scraperApiClient = new ScraperApiClient();

export const {
  runCareerBuilder,
  runIndeed,
  runZipRecruiter,
  runTekSystems,
  runDice,
  runAllScrapers,
  getScraperStatus,
  getScrapingLogs,
} = scraperApiClient;