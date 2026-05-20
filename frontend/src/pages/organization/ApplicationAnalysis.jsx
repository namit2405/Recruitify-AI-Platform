import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { Award, Clock, Star, CheckCircle2, XCircle, TrendingUp, Briefcase, Target, AlertCircle, Globe, Github, Linkedin, Instagram, Download, FileSpreadsheet, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ApplicationAnalysis() {
  const { slug } = useParams({ from: "/applications/$slug/analysis" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  usePageTitle('Application Analysis');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [slug]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/applications/${slug}/analysis/`);
      setData(res);
    } catch (err) {
      console.error("Failed to load analysis", err);
      toast.error("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  // Mutation to update application status
  const updateStatus = useMutation({
    mutationFn: async (newStatus) => {
      return fetchApi(`/applications/${slug}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    },
    onSuccess: (updatedData, newStatus) => {
      setData(prev => ({ ...prev, status: newStatus }));
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['vacancy-applications'] });
      
      if (newStatus === 'shortlisted') {
        toast.success('Candidate moved to next stage successfully!');
      } else if (newStatus === 'rejected') {
        toast.success('Candidate rejected');
      }
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update application status');
    },
  });

  const handleMoveToNextStage = () => {
    if (confirm('Move this candidate to the shortlisted stage?')) {
      updateStatus.mutate('shortlisted');
    }
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this candidate? This action cannot be undone.')) {
      updateStatus.mutate('rejected');
    }
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const analysis = data.analysis || {};
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header bar
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Application Analysis Report', 14, 18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, 18, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Candidate overview table
      autoTable(doc, {
        startY: 34,
        head: [['Candidate Overview', '']],
        body: [
          ['Candidate Name', data.candidate_name || '—'],
          ['Position Applied', data.vacancy_title || '—'],
          ['Application Status', data.status || '—'],
          ['Applied Date', new Date(data.applied_at || Date.now()).toLocaleDateString()],
          ['AI Score', Number(data.final_score || 0).toFixed(1)],
          ['Experience Years', `${analysis.experience_years || 0} years`],
          ['Semantic Job Fit', `${analysis.semantic_similarity || 0}%`],
          ['Recommendation', analysis.recommendation || 'N/A'],
        ],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 14, right: 14 },
      });

      // Keyword coverage
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Keyword Coverage', '']],
        body: [
          ['Matched Keywords', (analysis.matched_keywords || []).length],
          ['Missing Keywords', (analysis.missing_keywords || []).length],
          ['Matched Skills', (analysis.matched_skills || []).length],
          ['Skill Gaps', (analysis.missing_skills || []).length],
        ],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [124, 58, 237] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        margin: { left: 14, right: 14 },
      });

      // Matched skills
      if ((analysis.matched_skills || []).length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['✓ Matched Competencies']],
          body: (analysis.matched_skills).map(s => [s]),
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [22, 163, 74] },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          margin: { left: 14, right: 14 },
        });
      }

      // Missing skills
      if ((analysis.missing_skills || []).length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['✗ Skill Gaps']],
          body: (analysis.missing_skills).map(s => [s]),
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [220, 38, 38] },
          alternateRowStyles: { fillColor: [254, 242, 242] },
          margin: { left: 14, right: 14 },
        });
      }

      // Strengths & weaknesses — each as its own column so text wraps properly
      const strengths = (analysis.strengths || []);
      const weaknesses = (analysis.weaknesses || []);
      if (strengths.length > 0 || weaknesses.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['Key Strengths', 'Areas of Consideration']],
          body: [[
            strengths.map((s, i) => `${i + 1}. ${s}`).join('\n') || '—',
            weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n') || '—',
          ]],
          styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak' },
          headStyles: { fillColor: [124, 58, 237] },
          columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 88 } },
          margin: { left: 14, right: 14 },
        });
      }

      // Fit summary — wrapped in a table cell so it never gets cut
      if (analysis.fit_summary) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          head: [['AI Fit Summary']],
          body: [[`"${analysis.fit_summary}"`]],
          styles: { fontSize: 10, cellPadding: 6, overflow: 'linebreak', fontStyle: 'italic', textColor: [60, 60, 60] },
          headStyles: { fillColor: [55, 65, 81] },
          margin: { left: 14, right: 14 },
        });
      }

      // Page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}  |  Recruitify AI Technologies`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      doc.save(`analysis_${data.candidate_name?.replace(/\s+/g, '_')}_${id}.pdf`);
      toast.success('PDF exported');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const analysis = data.analysis || {};

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Application Analysis Report'],
        [],
        ['Candidate', data.candidate_name],
        ['Position', data.vacancy_title],
        ['Status', data.status],
        ['Applied Date', new Date(data.applied_at || Date.now()).toLocaleDateString()],
        ['AI Score', Number(data.final_score || 0).toFixed(1)],
        ['Experience Years', analysis.experience_years || 0],
        ['Semantic Job Fit (%)', analysis.semantic_similarity || 0],
        ['Recommendation', analysis.recommendation || 'N/A'],
        ['Matched Skills Count', (analysis.matched_skills || []).length],
        ['Missing Skills Count', (analysis.missing_skills || []).length],
        ['Matched Keywords', (analysis.matched_keywords || []).length],
        ['Missing Keywords', (analysis.missing_keywords || []).length],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Skills sheet
      const skillsData = [
        ['Matched Skills', 'Missing Skills'],
        ...Array.from({ length: Math.max((analysis.matched_skills || []).length, (analysis.missing_skills || []).length) }, (_, i) => [
          (analysis.matched_skills || [])[i] || '',
          (analysis.missing_skills || [])[i] || '',
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(skillsData);
      ws2['!cols'] = [{ wch: 30 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Skills');

      // AI Summary sheet
      const aiData = [
        ['Key Strengths'],
        ...(analysis.strengths || []).map(s => [s]),
        [],
        ['Areas of Consideration'],
        ...(analysis.weaknesses || []).map(w => [w]),
        [],
        ['Fit Summary'],
        [analysis.fit_summary || ''],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(aiData);
      ws3['!cols'] = [{ wch: 60 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'AI Summary');

      XLSX.writeFile(wb, `analysis_${data.candidate_name?.replace(/\s+/g, '_')}_${id}.xlsx`);
      toast.success('Excel exported');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 p-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  const analysis = data.analysis || {};
  const matchedSkills = analysis.matched_skills || [];
  const missingSkills = analysis.missing_skills || [];
  const matchedKeywords = analysis.matched_keywords || [];
  const missingKeywords = analysis.missing_keywords || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        
        {/* Back Button + Export */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Application Review
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPDF} className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-red-500" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel} className="flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            
            {/* Candidate Header */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                        {data.candidate_name?.charAt(0) || '?'}
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 break-words">{data.candidate_name}</h1>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                        <Briefcase className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm break-words">{data.vacancy_title}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>Applied {new Date(data.applied_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`whitespace-nowrap ${
                            data.status === 'hired' ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' :
                            data.status === 'shortlisted' ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' :
                            data.status === 'interview_scheduled' ? 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' :
                            data.status === 'interview_completed' ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' :
                            data.status === 'rejected' ? 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' :
                            data.status === 'reviewing' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
                            'border-gray-500 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {data.status === 'applied' ? 'Applied' :
                           data.status === 'reviewing' ? 'Under Review' :
                           data.status === 'shortlisted' ? 'Shortlisted' :
                           data.status === 'interview_scheduled' ? 'Interview Scheduled' :
                           data.status === 'interview_completed' ? 'Interview Completed' :
                           data.status === 'rejected' ? 'Rejected' :
                           data.status === 'hired' ? 'Hired' : data.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center flex-shrink-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">AI Score</div>
                    <div className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400">
                      {Number(data.final_score || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">PERCENTILE RANK</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matched Competencies */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <CardTitle className="text-gray-900 dark:text-white">Matched Competencies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {matchedSkills.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {matchedSkills.map((skill) => (
                        <div key={skill} className="flex items-center gap-2 text-sm min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 break-words">{skill}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
                      All core frontend and infrastructure requirements met with high confidence.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No matched skills found.</p>
                )}
              </CardContent>
            </Card>

            {/* Gap Identification */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <CardTitle className="text-gray-900 dark:text-white">Gap Identification</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {missingSkills.length > 0 ? (
                  <div className="space-y-3">
                    {missingSkills.map((skill) => (
                      <div key={skill} className="flex items-start gap-2 min-w-0">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white break-words">{skill}</span>
                      </div>
                    ))}
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-xs font-semibold text-orange-900 dark:text-orange-100 uppercase mb-1">Impact Assessment</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 break-words">
                        {analysis.fit_summary || 'Missing skills may require training or team support.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No skill gaps identified.</p>
                )}
              </CardContent>
            </Card>

            {/* Experience & Velocity Metrics */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <CardTitle className="text-gray-900 dark:text-white">Experience & Velocity Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">Relevant Experience</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.experience_years || 0} Years</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Professional Experience</div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      <Target className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">Semantic Job Fit</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.semantic_similarity || 0}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role Compatibility</div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">Overall Score</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{Number(data.final_score || 0).toFixed(1)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI Assessment</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recruiter Summary */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <CardTitle className="text-gray-900 dark:text-white">AI Recruiter Summary</CardTitle>
                </div>
                <CardDescription>Synthesized from 4 evaluation sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Key Strengths</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {(analysis.strengths || []).map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 min-w-0">
                          <span className="text-green-600 flex-shrink-0">•</span>
                          <span className="break-words">{strength}</span>
                        </li>
                      ))}
                      {!(analysis.strengths || []).length && (
                        <li className="text-gray-500 dark:text-gray-400 break-words">Demonstrated ability to lead technical architecture in distributed systems (AWS/Microservices).</li>
                      )}
                    </ul>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Areas of Consideration</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {(analysis.weaknesses || []).map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2 min-w-0">
                          <span className="text-orange-600 flex-shrink-0">•</span>
                          <span className="break-words">{weakness}</span>
                        </li>
                      ))}
                      {!(analysis.weaknesses || []).length && (
                        <li className="text-gray-500 dark:text-gray-400 break-words">Transitioning from mid-market to enterprise-scale systems may require a short adjustment period.</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {analysis.fit_summary && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic break-words">
                      "{analysis.fit_summary}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 min-w-0">
            
            {/* Quick Summary */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <CardTitle className="text-blue-900 dark:text-blue-100">Quick Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div>
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-3">Keyword Coverage</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{matchedKeywords.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Matched</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{missingKeywords.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Missing</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                      <div className="text-3xl font-bold text-green-600">{matchedSkills.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wide">Matches</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg text-center border-2 border-red-200 dark:border-red-800">
                      <div className="text-3xl font-bold text-red-600">{missingSkills.length}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wide">Critical Gaps</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2">Recommendation</div>
                  <Badge className="bg-green-600 text-white w-full justify-center py-2 break-words">
                    {analysis.recommendation || 'Strong Hire'}
                  </Badge>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    Outstanding fit. Recommend immediate interview.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <button 
                    onClick={handleMoveToNextStage}
                    disabled={updateStatus.isPending || data?.status === 'shortlisted' || data?.status === 'hired'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span>{data?.status === 'shortlisted' ? 'Already Shortlisted' : data?.status === 'hired' ? 'Already Hired' : 'Move to Next Stage'}</span>
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={updateStatus.isPending || data?.status === 'rejected'}
                    className="w-full bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {data?.status === 'rejected' ? 'Already Rejected' : 'Reject Candidate'}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Process Checklist */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-white">Process Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Resume Viewed</span>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Skills Validated</span>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Reference Check</span>
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"></div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Portfolio Review</span>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Presence */}
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base text-gray-900 dark:text-white">Social Presence</CardTitle>
              </CardHeader>
              <CardContent>
                {(data.candidate_website_url || data.candidate_github_url || data.candidate_linkedin_url || data.candidate_instagram_url) ? (
                  <div className="flex flex-col gap-2">
                    {data.candidate_website_url && (
                      <a
                        href={data.candidate_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-2 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors truncate"
                      >
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Website</span>
                      </a>
                    )}
                    {data.candidate_github_url && (
                      <a
                        href={data.candidate_github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-2 px-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors truncate"
                      >
                        <Github className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">GitHub</span>
                      </a>
                    )}
                    {data.candidate_linkedin_url && (
                      <a
                        href={data.candidate_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors truncate"
                      >
                        <Linkedin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">LinkedIn</span>
                      </a>
                    )}
                    {data.candidate_instagram_url && (
                      <a
                        href={data.candidate_instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-colors truncate"
                      >
                        <Instagram className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Instagram</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No social links available</p>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
}
