type JobQueryParams = {
  search?: string;
  link?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
};

type UserQueryParams = {
  search?: string;
  limit?: number;
  offset?: number;
};