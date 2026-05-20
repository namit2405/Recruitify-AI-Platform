import { useState, useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, User, LogOut, Briefcase, UserCircle, ArrowLeft, Search, Bell, Building2, Users, MapPin, MessageCircle, BookOpen, Moon, Sun, Send } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme.jsx";
import { fetchApi } from "@/lib/api";
import { useGetCallerUserProfile, useSearchSuggestions, useGetUnreadNotificationCount } from "../hooks/useQueries";
import { useGetUnreadCount } from "../hooks/useChatQueries";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Get search suggestions
  const { data: suggestionsData } = useSearchSuggestions(searchQuery);
  const suggestions = suggestionsData?.suggestions || [];

  // Get unread notification count
  const { data: notificationData } = useGetUnreadNotificationCount();
  const notificationCount = notificationData?.unread_count || 0;

  // Get unread chat count
  const { data: chatUnreadData } = useGetUnreadCount();
  const chatUnreadCount = chatUnreadData?.unread_count || 0;

  const isAuthenticated = !!user;
  const isOrganization = userProfile?.userType === "organization";
  const isCandidate = userProfile?.userType === "candidate";

  // Get pending job offers count (candidates only)
  const { data: pendingOffersData } = useQuery({
    queryKey: ["job-offers-pending-count"],
    queryFn: async () => {
      const offers = await fetchApi("/job-offers/");
      return offers.filter(o => o.status === "pending").length;
    },
    enabled: isCandidate,
    staleTime: 60 * 1000,
  });
  const pendingOffersCount = pendingOffersData || 0;
  const displayName =
    userProfile?.organization?.name ||
    userProfile?.candidate?.name ||
    user?.email ||
    "User";

  // Check if we're on the home page
  const currentPath = routerState.location.pathname;
  const isHomePage = currentPath === "/";

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show suggestions when typing
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleBack = () => {
    window.history.back();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: "/search", search: { q: searchQuery } });
      setShowSearch(false); // Close mobile search
      setShowSuggestions(false); // Close suggestions
      setSearchQuery(""); // Clear search input
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'vacancy') {
      navigate({ to: "/candidate/jobs" });
    } else if (suggestion.type === 'candidate') {
      navigate({ to: `/public/candidate/${suggestion.slug}` });
    } else if (suggestion.type === 'organization') {
      navigate({ to: `/public/organization/${suggestion.slug}` });
    } else if (suggestion.type === 'skill' || suggestion.type === 'location' || suggestion.type === 'experience') {
      // Search for the skill/location/experience
      navigate({ to: "/search", search: { q: suggestion.text } });
    }
    setShowSuggestions(false);
    setSearchQuery("");
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'vacancy':
        return <Briefcase className="h-4 w-4" />;
      case 'candidate':
        return <User className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      case 'skill':
        return <Search className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'experience':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = () => {
    navigate({ to: "/notifications" });
  };

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const handleDashboard = () => {
    if (isOrganization) navigate({ to: "/organization/dashboard" });
    else if (isCandidate) navigate({ to: "/candidate/dashboard" });
  };

  const handleProfile = () => {
    if (isOrganization) navigate({ to: "/organization/profile" });
    else if (isCandidate) navigate({ to: "/candidate/profile" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-4">
            {/* Back Button - subtle */}
            {!isHomePage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -ml-2"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              onClick={() => navigate({ to: "/" })}
            >
              <img
                src="/images/Header, Footer-dark.png"
                alt="Recruitify"
                className="hidden dark:block h-[3.75rem] w-auto"
              />
              <img
                src="/images/Header, Cards, Features and Footer-light.png"
                alt="Recruitify"
                className="block dark:hidden h-[3.75rem] w-auto"
              />
            </div>

            {/* Desktop Navigation Links */}
            {!isAuthenticated ? (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate({ to: "/" })}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Home
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate({ to: "/register" })}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Register
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate({ to: "/browse-jobs" })}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Browse Jobs
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate({ to: "/documentation" })}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  How It Works
                </Button>
              </nav>
            ) : (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {isOrganization ? (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/organization/dashboard" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/feed" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Feed
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/organization/candidates" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Candidates
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/organization/vacancies" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      My Jobs
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/organization/talent-pool" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Talent Pool
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/organization/offers" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Sent Offers
                    </Button>
                  </>
                ) : isCandidate ? (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/candidate/dashboard" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/feed" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Feed
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/candidate/jobs" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Find Jobs
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/candidate/applications" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      Applications
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/candidate/offers" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium relative"
                    >
                      Job Offers
                      {pendingOffersCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {pendingOffersCount}
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate({ to: "/candidate/communities" })}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                      My Communities
                    </Button>
                  </>
                ) : null}
              </nav>
            )}
          </div>

          {/* Right side - Search, Actions, and User */}
          <div className="flex items-center gap-3">
            {/* Desktop Search Bar */}
            {isAuthenticated && (
              <div ref={searchRef} className="hidden lg:block relative">
                <form onSubmit={handleSearch}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search jobs, applicants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    className="pl-9 w-64 h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                      >
                        <span className="text-gray-500 dark:text-gray-400">
                          {getSuggestionIcon(suggestion.type)}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{suggestion.text}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate({ to: "/login" })}
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => navigate({ to: '/register/organization' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-9 rounded-lg"
                >
                  Post a Job
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                {/* Notification Icons */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  onClick={() => navigate({ to: "/chat" })}
                  title="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  {chatUnreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  onClick={handleNotificationClick}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Badge>
                  )}
                </Button>

                {/* Help Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate({ to: "/documentation" })}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title="Help"
                >
                  <BookOpen className="h-5 w-5" />
                </Button>

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-72 p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                    {/* Profile Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg relative">
                          {displayName.charAt(0).toUpperCase()}
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isCandidate && `Candidate ID: #${userProfile?.entityId}`}
                            {isOrganization && `Organization ID: #${userProfile?.entityId}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <DropdownMenuItem onClick={handleProfile} className="px-3 py-2.5 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <UserCircle className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDashboard} className="px-3 py-2.5 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Briefcase className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate({ to: "/settings" })} className="px-3 py-2.5 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Users className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">Settings</span>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-0 bg-gray-200 dark:bg-gray-700" />

                    {/* Logout */}
                    <div className="p-2">
                      <DropdownMenuItem onClick={handleLogout} className="px-3 py-2.5 cursor-pointer rounded-lg text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <LogOut className="mr-3 h-5 w-5" />
                        <span className="font-medium">Logout</span>
                      </DropdownMenuItem>
                    </div>

                    {/* Analytics Link */}
                    {isCandidate && (
                      <>
                        <DropdownMenuSeparator className="my-0 bg-gray-200 dark:bg-gray-700" />
                        <div className="p-3 bg-gray-50 dark:bg-gray-900">
                          <button
                            onClick={() => {
                              navigate({ to: "/candidate/analytics" });
                            }}
                            className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                          >
                            View Analytics Detail
                          </button>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Post Job Button for Organizations */}
                {isOrganization && (
                  <Button
                    onClick={() => navigate({ to: '/organization/post-vacancy' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-9 rounded-lg ml-2"
                  >
                    Post New Vacancy
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-1">
              {/* Mobile Search Toggle */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search"
                  className="h-9 w-9 text-gray-900 dark:text-white"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 relative text-gray-900 dark:text-white">
                    <Menu className="h-6 w-6" />
                    {/* Combined notification badge */}
                    {isAuthenticated && (notificationCount > 0 || chatUnreadCount > 0) && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                      >
                        {(notificationCount + chatUnreadCount) > 9 ? "9+" : (notificationCount + chatUnreadCount)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-72 bg-white dark:bg-gray-900">
                  <nav className="flex flex-col gap-3 mt-8">
                    {!isAuthenticated ? (
                      <>
                        <Button 
                          onClick={() => {
                            navigate({ to: "/" });
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Home
                        </Button>
                        <Button 
                          onClick={() => {
                            navigate({ to: "/documentation" });
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          How to Use
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Notification Items */}
                        <Button 
                          onClick={() => {
                            navigate({ to: "/chat" });
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start relative text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MessageCircle className="h-5 w-5 mr-3" />
                          Messages
                          {chatUnreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                            </Badge>
                          )}
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            handleNotificationClick();
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start relative text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Bell className="h-5 w-5 mr-3" />
                          Notifications
                          {notificationCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                              {notificationCount > 9 ? "9+" : notificationCount}
                            </Badge>
                          )}
                        </Button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        {/* Navigation Items */}
                        <Button 
                          onClick={() => {
                            handleDashboard();
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Briefcase className="h-5 w-5 mr-3" />
                          Dashboard
                        </Button>
                        <Button 
                          onClick={() => {
                            navigate({ to: "/feed" });
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BookOpen className="h-5 w-5 mr-3" />
                          Feed
                        </Button>

                        {/* Organization-specific links */}
                        {isOrganization && (
                          <>
                            <Button
                              onClick={() => { navigate({ to: "/organization/candidates" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Users className="h-5 w-5 mr-3" />
                              Candidates
                            </Button>
                            <Button
                              onClick={() => { navigate({ to: "/organization/vacancies" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Briefcase className="h-5 w-5 mr-3" />
                              My Jobs
                            </Button>
                            <Button
                              onClick={() => { navigate({ to: "/organization/talent-pool" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <UserCircle className="h-5 w-5 mr-3" />
                              Talent Pool
                            </Button>
                            <Button
                              onClick={() => { navigate({ to: "/organization/offers" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Send className="h-5 w-5 mr-3" />
                              Sent Offers
                            </Button>
                          </>
                        )}

                        {/* Candidate-specific links */}
                        {isCandidate && (
                          <>
                            <Button
                              onClick={() => { navigate({ to: "/candidate/jobs" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Search className="h-5 w-5 mr-3" />
                              Find Jobs
                            </Button>
                            <Button
                              onClick={() => { navigate({ to: "/candidate/applications" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Briefcase className="h-5 w-5 mr-3" />
                              Applications
                            </Button>
                            <Button
                              onClick={() => { navigate({ to: "/candidate/offers" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start relative text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Send className="h-5 w-5 mr-3" />
                              Job Offers
                              {pendingOffersCount > 0 && (
                                <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                                  {pendingOffersCount > 9 ? "9+" : pendingOffersCount}
                                </Badge>
                              )}
                            </Button>
                            <Button
                              onClick={() => { navigate({ to: "/candidate/communities" }); setMobileMenuOpen(false); }}
                              variant="ghost"
                              className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Users className="h-5 w-5 mr-3" />
                              My Communities
                            </Button>
                          </>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        <Button 
                          onClick={() => {
                            handleProfile();
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <UserCircle className="h-5 w-5 mr-3" />
                          Profile
                        </Button>
                        <Button 
                          onClick={() => {
                            navigate({ to: "/settings" });
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Users className="h-5 w-5 mr-3" />
                          Settings
                        </Button>

                        {/* Post New Vacancy for Organizations */}
                        {isOrganization && (
                          <Button
                            onClick={() => { navigate({ to: "/organization/post-vacancy" }); setMobileMenuOpen(false); }}
                            className="justify-start bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Briefcase className="h-5 w-5 mr-3" />
                            Post New Vacancy
                          </Button>
                        )}

                        <Button 
                          onClick={() => {
                            navigate({ to: "/documentation" });
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <BookOpen className="h-5 w-5 mr-3" />
                          Help
                        </Button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        {/* Theme Toggle */}
                        <Button 
                          onClick={() => {
                            toggleTheme();
                          }}
                          variant="ghost"
                          className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {theme === 'dark' ? (
                            <>
                              <Sun className="h-5 w-5 mr-3" />
                              Light Mode
                            </>
                          ) : (
                            <>
                              <Moon className="h-5 w-5 mr-3" />
                              Dark Mode
                            </>
                          )}
                        </Button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        {/* Logout */}
                        <Button 
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="justify-start text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Logout
                        </Button>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isAuthenticated && showSearch && (
          <div className="md:hidden pb-4">
            <div ref={searchRef} className="relative">
              <form onSubmit={handleSearch}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search jobs, people, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="pl-9 w-full text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  autoFocus
                />
              </form>

              {/* Mobile Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSuggestionClick(suggestion);
                        setShowSearch(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                    >
                      <span className="text-gray-500 dark:text-gray-400">
                        {getSuggestionIcon(suggestion.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{suggestion.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.subtitle}</p>
                      </div>
                    </button>
                  ))}
                  {searchQuery.trim() && (
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs">Enter</kbd> to search for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
