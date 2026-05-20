// src/hooks/useQueries.jsx
// Backend API integration

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { getToken } from '@/lib/api';

/* =========================
   USER PROFILE
========================= */
export function useGetCallerUserProfile() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const data = await fetchApi('/auth/profile/');
      return {
        user: data.user,
        userType: data.user.user_type,
        organization: data.organization,
        candidate: data.candidate,
        entityId: data.user.user_type === 'organization' ? data.organization?.id : data.candidate?.id,
      };
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSaveCallerUserProfile() {
  return {
    isPending: false,
    mutateAsync: async (profile) => {
      console.log("saveCallerUserProfile:", profile);
      await new Promise((r) => setTimeout(r, 400));
      return true;
    },
  };
}

/* =========================
   ORGANIZATION
========================= */
export function useRegisterOrganization() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        name: data.name,
        description: data.description ?? '',
        contact_email: data.contactEmail,
        website: data.website ?? '',
        location: data.location ?? '',
        phone: data.phone ?? '',
        established: data.established ?? null,
      };
      return fetchApi('/auth/profile/organization/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useGetOrganizationProfile(organizationId) {
  const token = getToken();
  const query = useQuery({
    queryKey: ['organization-profile', organizationId],
    queryFn: async () => {
      try {
        const data = await fetchApi('/auth/profile/organization/');
        return {
          name: data.name,
          description: data.description,
          contactEmail: data.contact_email,
          website: data.website,
          location: data.location,
          phone: data.phone,
          established: data.established,
          logoPath: data.logo_path,
          profile_picture_url: data.profile_picture_url,
          cover_photo_url: data.cover_photo_url,
        };
      } catch (error) {
        // Return null if profile doesn't exist (404), let other errors bubble up
        if (error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!token && !!organizationId,
    retry: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    refetch: query.refetch,
  };
}

export function useUpdateOrganizationProfile() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        name: data.name,
        description: data.description ?? '',
        contact_email: data.contactEmail,
        website: data.website ?? '',
        location: data.location ?? '',
        phone: data.phone ?? '',
        established: data.established ?? null,
      };
      return fetchApi('/auth/profile/organization/', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

/* =========================
   CANDIDATE
========================= */
export function useRegisterCandidate() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        name: data.name,
        phone: data.phone ?? '',
        address: data.address ?? '',
        skills: data.skills ?? [],
        experience: data.experience ?? [],
        education: data.education ?? [],
        accomplishments: data.accomplishments ?? [],
        availability: data.availability ?? '',
        summary: data.summary ?? '',
        job_preferences: data.jobPreferences ?? [],
        website_url: data.website_url ?? '',
        github_url: data.github_url ?? '',
        linkedin_url: data.linkedin_url ?? '',
        instagram_url: data.instagram_url ?? '',
      };
      return fetchApi('/auth/profile/candidate/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useGetCandidateProfile(candidateId) {
  const token = getToken();
  const query = useQuery({
    queryKey: ['candidate-profile', candidateId],
    queryFn: async () => {
      try {
        const data = await fetchApi('/auth/profile/candidate/');
        return {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          skills: data.skills || [],
          experience: data.experience || [],
          education: data.education || [],
          accomplishments: data.accomplishments || [],
          availability: data.availability,
          summary: data.summary,
          jobPreferences: data.job_preferences || [],
          resume_url: data.resume_url,
          profile_picture_url: data.profile_picture_url,
          cover_photo_url: data.cover_photo_url,
          website_url: data.website_url,
          github_url: data.github_url,
          linkedin_url: data.linkedin_url,
          instagram_url: data.instagram_url,
        };
      } catch (error) {
        // Return null if profile doesn't exist (404), let other errors bubble up
        if (error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!token && !!candidateId,
    retry: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    refetch: query.refetch,
  };
}

export function useUpdateCandidateProfile() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        name: data.name,
        phone: data.phone ?? '',
        address: data.address ?? '',
        skills: data.skills ?? [],
        experience: data.experience ?? [],
        education: data.education ?? [],
        accomplishments: data.accomplishments ?? [],
        availability: data.availability ?? '',
        summary: data.summary ?? '',
        job_preferences: data.jobPreferences ?? [],
        website_url: data.website_url ?? '',
        github_url: data.github_url ?? '',
        linkedin_url: data.linkedin_url ?? '',
        instagram_url: data.instagram_url ?? '',
      };
      return fetchApi('/auth/profile/candidate/', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['public-candidate'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('resume', file);
      return fetchApi('/auth/profile/candidate/resume/', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useUploadCandidateProfilePicture() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('profile_picture', file);
      return fetchApi('/auth/profile/candidate/profile-picture/', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useUploadCandidateCoverPhoto() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('cover_photo', file);
      return fetchApi('/auth/profile/candidate/cover-photo/', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useUploadOrganizationProfilePicture() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('profile_picture', file);
      return fetchApi('/auth/profile/organization/profile-picture/', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useUploadOrganizationCoverPhoto() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('cover_photo', file);
      return fetchApi('/auth/profile/organization/cover-photo/', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

/* =========================
   VACANCIES / APPLICATIONS
========================= */
export function useGetActiveVacancies() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['vacancies', 'active'],
    queryFn: async () => {
      const data = await fetchApi('/vacancies/');
      return data;
    },
    enabled: !!token,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    refetch: query.refetch,
  };
}

export function useApplyForVacancy() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        vacancy_slug: data.vacancySlug,
        cover_letter: data.coverLetter,
      };
      if (data.passcode) {
        body.passcode = data.passcode;
      }
      return fetchApi('/applications/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useGetVacanciesByOrganization() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['vacancies', 'organization'],
    queryFn: async () => {
      const data = await fetchApi('/vacancies/');
      return data;
    },
    enabled: !!token,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    refetch: query.refetch,
  };
}

export function useGetVacancyApplications(vacancyId) {
  const token = getToken();

  return useQuery({
    queryKey: ['applications', 'vacancy', vacancyId],
    queryFn: async () => {
      const data = await fetchApi('/applications/');
      return vacancyId
        ? data.filter(app => app.vacancy_slug === vacancyId || String(app.vacancy) === String(vacancyId))
        : data;
    },
    enabled: !!token && !!vacancyId,
  });
}


export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, status }) => {
      return fetchApi(`/applications/${slug}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    onSuccess: (_, __, variables) => {
      // ✅ invalidate ALL application queries
      queryClient.invalidateQueries({
        queryKey: ['applications'],
        exact: false,
      });
    },
  });
}


export function useUpdateVacancyStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ slug, status }) => {
      return fetchApi(`/vacancies/${slug}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacancies'] }),
  });
  
  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function usePostVacancy() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => {
      const body = {
        title: data.title,
        description: data.description,
        requirements: data.requirements, // ensure array
        location: data.location,
        salary_range: data.salaryRange,
        is_public: data.isPublic,
        status: 'open',
        experience_level: data.experienceLevel,
        benefits: data.benefits,
      };
      return fetchApi('/vacancies/', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacancies'] }),
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useGetCandidateApplications() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['applications', 'candidate'],
    queryFn: async () => {
      const data = await fetchApi('/applications/');
      return data;
    },
    enabled: !!token,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
  };
}

export function useGlobalSearch(searchQuery) {
  const token = getToken();
  const query = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim() === '') {
        return {
          vacancies: [],
          candidates: [],
          organizations: [],
          total_results: 0,
        };
      }
      const data = await fetchApi(`/search/?q=${encodeURIComponent(searchQuery)}`);
      return data;
    },
    enabled: !!token && !!searchQuery && searchQuery.trim() !== '',
  });

  return {
    data: query.data || { vacancies: [], candidates: [], organizations: [], total_results: 0 },
    isLoading: query.isLoading,
  };
}

export function useSearchSuggestions(searchQuery) {
  const token = getToken();
  const query = useQuery({
    queryKey: ['search-suggestions', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return { suggestions: [] };
      }
      const data = await fetchApi(`/search/suggestions/?q=${encodeURIComponent(searchQuery)}`);
      return data;
    },
    enabled: !!token && !!searchQuery && searchQuery.trim().length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  return {
    data: query.data || { suggestions: [] },
    isLoading: query.isLoading,
  };
}

/* =========================
   NOTIFICATIONS
========================= */
export function useGetNotifications() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await fetchApi('/notifications/');
      return data;
    },
    enabled: !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useGetUnreadNotificationCount() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const data = await fetchApi('/notifications/unread-count/');
      return data;
    },
    enabled: !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    data: query.data || { unread_count: 0 },
    isLoading: query.isLoading,
  };
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (notificationId) => {
      return fetchApi(`/notifications/${notificationId}/mark-read/`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      return fetchApi('/notifications/mark-all-read/', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (notificationId) => {
      return fetchApi(`/notifications/${notificationId}/delete/`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

/* =========================
   ANALYTICS
========================= */
export function useGetOrganizationAnalytics() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['organization-analytics'],
    queryFn: async () => {
      return await fetchApi('/analytics/organization/');
    },
    enabled: !!token,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useGetCandidateAnalytics() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['candidate-analytics'],
    queryFn: async () => {
      return await fetchApi('/analytics/candidate/');
    },
    enabled: !!token,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}



/* =========================
   JOB OFFERS
========================= */
export function useGetRecommendedCandidates(vacancySlug) {
  return useQuery({
    queryKey: ['recommended-candidates', vacancySlug],
    queryFn: () => fetchApi(`/vacancies/${vacancySlug}/recommended-candidates/`),
    enabled: !!vacancySlug,
  });
}

export function useSendJobOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetchApi('/job-offers/send/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-offers'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-candidates'] });
    },
  });
}

export function useGetJobOffers() {
  return useQuery({
    queryKey: ['job-offers'],
    queryFn: () => fetchApi('/job-offers/'),
  });
}

export function useRespondToJobOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerSlug, status }) => fetchApi(`/job-offers/${offerSlug}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-offers'] });
    },
  });
}



/* =========================
   USER SETTINGS & PREFERENCES
========================= */

export function useGetUserPreferences() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      return await fetchApi('/auth/settings/preferences/');
    },
    enabled: !!token,
    retry: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (preferences) => {
      return fetchApi('/auth/settings/preferences/', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useChangePassword() {
  const mutation = useMutation({
    mutationFn: async (passwordData) => {
      return fetchApi('/auth/settings/change-password/', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

export function useDeleteAccount() {
  const mutation = useMutation({
    mutationFn: async (password) => {
      return fetchApi('/auth/settings/delete-account/', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    },
  });

  return {
    isPending: mutation.isPending,
    mutateAsync: mutation.mutateAsync,
  };
}

/* =========================
   SMART FEATURES
========================= */
export function useProfileStrength() {
  const token = getToken();
  return useQuery({
    queryKey: ['profile-strength'],
    queryFn: () => fetchApi('/smart/profile-strength/'),
    enabled: !!token,
    staleTime: 30000,
  });
}

export function useSmartJobRecommendations() {
  const token = getToken();
  return useQuery({
    queryKey: ['smart-job-recommendations'],
    queryFn: () => fetchApi('/smart/job-recommendations/'),
    enabled: !!token,
    staleTime: 60000,
  });
}

export function useSkillGap(vacancySlug) {
  const token = getToken();
  return useQuery({
    queryKey: ['skill-gap', vacancySlug],
    queryFn: () => fetchApi(`/smart/skill-gap/${vacancySlug}/`),
    enabled: !!token && !!vacancySlug,
    staleTime: 60000,
  });
}

export function useHiringPipeline(vacancySlug) {
  const token = getToken();
  return useQuery({
    queryKey: ['hiring-pipeline', vacancySlug],
    queryFn: () => fetchApi(`/smart/hiring-pipeline/${vacancySlug ? `?vacancy=${vacancySlug}` : ''}`),
    enabled: !!token,
    staleTime: 30000,
  });
}
