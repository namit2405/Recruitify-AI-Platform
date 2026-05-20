import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

export function useGetOrganizationDashboardAnalytics() {
  return useQuery({
    queryKey: ['organization-dashboard'],
    queryFn: () => fetchApi('/organization/dashboard/'),
  });
}
