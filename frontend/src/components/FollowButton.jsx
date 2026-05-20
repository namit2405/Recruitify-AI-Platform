import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';

export default function FollowButton({ userId, className = "" }) {
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  
  // Check if viewing own profile - ensure both are numbers for comparison
  const currentUserId = userProfile?.user?.id;
  const profileUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  const isOwnProfile = currentUserId && currentUserId === profileUserId;
  
  // Fetch follow status (always fetch to get counts)
  const { data: followStatus, isLoading } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => fetchApi(`/auth/follow-status/${userId}/`),
    enabled: !!userId,
  });
  
  // Fetch followers list
  const { data: followersData, isLoading: followersLoading, error: followersError } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      console.log('Fetching followers for userId:', userId);
      const data = await fetchApi(`/auth/followers/${userId}/`);
      console.log('Followers data received:', data);
      return data;
    },
    enabled: showFollowersModal && !!userId,
  });
  
  // Fetch following list
  const { data: followingData, isLoading: followingLoading, error: followingError } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      console.log('Fetching following for userId:', userId);
      const data = await fetchApi(`/auth/following/${userId}/`);
      console.log('Following data received:', data);
      return data;
    },
    enabled: showFollowingModal && !!userId,
  });
  
  const followMutation = useMutation({
    mutationFn: () => fetchApi(`/auth/follow/${userId}/`, { 
      method: 'POST',
      body: JSON.stringify({}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      toast.success('Followed successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to follow');
    },
  });
  
  const unfollowMutation = useMutation({
    mutationFn: () => fetchApi(`/auth/unfollow/${userId}/`, { 
      method: 'POST',
      body: JSON.stringify({}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      toast.success('Unfollowed');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to unfollow');
    },
  });
  
  const handleClick = () => {
    if (followStatus?.is_following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };
  
  const isPending = followMutation.isPending || unfollowMutation.isPending;
  
  if (isLoading) {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">--</span> followers
          <span className="mx-2">·</span>
          <span className="font-semibold">--</span> following
        </div>
        <Button variant="outline" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </Button>
      </div>
    );
  }
  
  // Don't show follow button if viewing own profile
  if (isOwnProfile) {
    return (
      <>
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
          <div className="text-sm text-gray-600 dark:text-gray-400 select-none flex items-center gap-1">
            <span 
              className="font-semibold cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Followers count clicked, opening modal');
                setShowFollowersModal(true);
              }}
            >
              {followStatus?.followers_count || 0} followers
            </span>
            <span>·</span>
            <span 
              className="font-semibold cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Following count clicked, opening modal');
                setShowFollowingModal(true);
              }}
            >
              {followStatus?.following_count || 0} following
            </span>
          </div>
        </div>
        
        <FollowersModal 
          open={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          followers={followersData?.followers || []}
          isLoading={followersLoading}
          error={followersError}
        />
        
        <FollowingModal 
          open={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          following={followingData?.following || []}
          isLoading={followingLoading}
          error={followingError}
        />
      </>
    );
  }
  
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <div className="text-sm text-gray-600 dark:text-gray-400 select-none flex items-center gap-1">
        <span 
          className="font-semibold cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Followers count clicked (with follow button), opening modal');
            setShowFollowersModal(true);
          }}
        >
          {followStatus?.followers_count || 0} followers
        </span>
        <span>·</span>
        <span 
          className="font-semibold cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Following count clicked (with follow button), opening modal');
            setShowFollowingModal(true);
          }}
        >
          {followStatus?.following_count || 0} following
        </span>
      </div>
      <Button
        onClick={handleClick}
        variant={followStatus?.is_following ? 'outline' : 'default'}
        disabled={isPending}
        className={followStatus?.is_following ? 'text-gray-900 dark:text-white' : 'bg-blue-600 hover:bg-blue-700'}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {followStatus?.is_following ? 'Unfollowing...' : 'Following...'}
          </>
        ) : (
          <>
            {followStatus?.is_following ? (
              <>
                <UserMinus className="mr-2 h-4 w-4" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Follow
              </>
            )}
          </>
        )}
      </Button>
      
      <FollowersModal 
        open={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followersData?.followers || []}
        isLoading={followersLoading}
        error={followersError}
      />
      
      <FollowingModal 
        open={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={followingData?.following || []}
        isLoading={followingLoading}
        error={followingError}
      />
    </div>
  );
}


// Followers Modal Component
function FollowersModal({ open, onClose, followers, isLoading, error }) {
  console.log('FollowersModal render:', { open, followersCount: followers?.length, isLoading, error });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">
              Failed to load followers: {error.message || 'Unknown error'}
            </p>
          ) : followers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No followers yet</p>
          ) : (
            followers.map((follower) => (
              <Link
                key={follower.user_id}
                to={`/public/${follower.type}/${follower.slug || follower.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
              >
                <Avatar>
                  <AvatarImage src={follower.profile_picture_url} />
                  <AvatarFallback>{follower.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{follower.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{follower.email}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Following Modal Component
function FollowingModal({ open, onClose, following, isLoading, error }) {
  console.log('FollowingModal render:', { open, followingCount: following?.length, isLoading, error });
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">
              Failed to load following: {error.message || 'Unknown error'}
            </p>
          ) : following.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Not following anyone yet</p>
          ) : (
            following.map((user) => (
              <Link
                key={user.user_id}
                to={`/public/${user.type}/${user.slug || user.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                onClick={onClose}
              >
                <Avatar>
                  <AvatarImage src={user.profile_picture_url} />
                  <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
