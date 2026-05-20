import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Download, 
  Eye,
  ChevronRight,
  Briefcase,
  Users,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function BrowseResumesPage() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Browse Resumes');
  
  const [expandedVacancies, setExpandedVacancies] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const { data: resumeData, isLoading } = useQuery({
    queryKey: ["organization-resumes"],
    queryFn: () => fetchApi("/resumes/browse/"),
  });

  const toggleVacancy = (vacancyId) => {
    setExpandedVacancies(prev => ({
      ...prev,
      [vacancyId]: !prev[vacancyId]
    }));
  };

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCategoryLabel = (categoryName) => {
    const labels = {
      'highly_preferred': 'Highly Preferred (60-100)',
      'mid_preference': 'Mid Preference (50-60)',
      'low_preference': 'Low Preference (25-50)',
      'no_visit': "Don't Need to Visit (0-25)",
    };
    return labels[categoryName] || categoryName;
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'highly_preferred': 'bg-green-100 text-green-800 border-green-300',
      'mid_preference': 'bg-blue-100 text-blue-800 border-blue-300',
      'low_preference': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'no_visit': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600',
    };
    return colors[categoryName] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://tag-committee-appliance-obtain.trycloudflare.com';

  const handleViewResume = (url) => {
    window.open(`${API_BASE}${url}`, '_blank');
  };

  const handleDownloadResume = (url, filename) => {
    const link = document.createElement('a');
    link.href = `${API_BASE}${url}`;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500/5 to-blue-600/5">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-64" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Browse Resumes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Efficiently manage candidate resumes organized by vacancy and scoring preference. Track your hiring pipeline in real time.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: '/organization/post-vacancy' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Create New Vacancy
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Vacancies
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {resumeData?.total_vacancies || 0}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Active vacancy listings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Total Resumes
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {resumeData?.total_resumes || 0}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Applications received
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Organization
                </p>
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {resumeData?.organization_name || 'N/A'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Managed business unit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open Vacancies Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vacancies</h2>
        </div>

        {/* Vacancy List */}
        {!resumeData?.vacancies || resumeData.vacancies.length === 0 ? (
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No resumes found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Resumes will appear here once candidates apply to your vacancies
              </p>
              <Button
                onClick={() => navigate({ to: '/organization/post-vacancy' })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Post Your First Vacancy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resumeData.vacancies.map((vacancy) => (
              <Card key={vacancy.id} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">{vacancy.title}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{vacancy.total_resumes} Resume{vacancy.total_resumes !== 1 ? 's' : ''}</span>
                          {' • '}
                          <span>{vacancy.categories.length} Categor{vacancy.categories.length !== 1 ? 'ies' : 'y'}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVacancy(vacancy.id)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      <ChevronRight 
                        className={`h-5 w-5 transition-transform ${expandedVacancies[vacancy.id] ? 'rotate-90' : ''}`} 
                      />
                    </Button>
                  </div>
                </CardHeader>

                {expandedVacancies[vacancy.id] && (
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {vacancy.categories.map((category) => {
                        const categoryKey = `${vacancy.id}-${category.name}`;
                        const isExpanded = expandedCategories[categoryKey];
                        
                        return (
                          <div key={categoryKey} className={`border rounded-lg overflow-hidden ${
                            category.name === 'highly_preferred' ? 'border-green-200 dark:border-green-800' :
                            category.name === 'mid_preference' ? 'border-blue-200 dark:border-blue-800' :
                            category.name === 'low_preference' ? 'border-yellow-200 dark:border-yellow-800' :
                            'border-gray-200 dark:border-gray-800'
                          }`}>
                            <button
                              onClick={() => toggleCategory(categoryKey)}
                              className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                                category.name === 'highly_preferred' ? 'bg-green-50 dark:bg-green-950/20' :
                                category.name === 'mid_preference' ? 'bg-blue-50 dark:bg-blue-950/20' :
                                category.name === 'low_preference' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                                'bg-gray-50 dark:bg-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  category.name === 'highly_preferred' ? 'bg-green-100 dark:bg-green-900/30' :
                                  category.name === 'mid_preference' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                  category.name === 'low_preference' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                  'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  <FileText className={`h-4 w-4 ${
                                    category.name === 'highly_preferred' ? 'text-green-600 dark:text-green-400' :
                                    category.name === 'mid_preference' ? 'text-blue-600 dark:text-blue-400' :
                                    category.name === 'low_preference' ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-gray-600 dark:text-gray-400'
                                  }`} />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {getCategoryLabel(category.name)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                                  {category.count}
                                </Badge>
                                <ChevronRight 
                                  className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                />
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
                                <div className="space-y-2">
                                  {category.resumes.map((resume, idx) => (
                                    <div 
                                      key={idx}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-sm transition-all group"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex-shrink-0">
                                          <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            {resume.candidate_name}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatFileSize(resume.size)} • PDF
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleViewResume(resume.url)}
                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            
            {resumeData.vacancies.length > 3 && (
              <div className="text-center pt-4">
                <Button variant="link" className="text-blue-600 dark:text-blue-400">
                  Load More Vacancies
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
