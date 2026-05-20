import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useGetCallerUserProfile, useGetOrganizationAnalytics } from '../../hooks/useQueries';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Target,
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS = {
  applied: '#3b82f6',
  reviewing: '#f59e0b',
  shortlisted: '#10b981',
  rejected: '#ef4444',
  hired: '#8b5cf6',
};

export default function OrganizationAnalytics() {
  const navigate = useNavigate();
  
  usePageTitle('Analytics');
  
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: analytics, isLoading: analyticsLoading } = useGetOrganizationAnalytics();

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== 'organization') {
      navigate({ to: '/' });
    }
  }, [profileLoading, userProfile, navigate]);

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const { applications, vacancies, metrics } = analytics || {};

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Analytics Dashboard Report', 14, 18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, 18, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Key metrics
      autoTable(doc, {
        startY: 34,
        head: [['Key Metrics', 'Value']],
        body: [
          ['Total Applications', applications?.total || 0],
          ['Pending Review', applications?.pending || 0],
          ['Shortlisted', applications?.shortlisted || 0],
          ['Hired', applications?.hired || 0],
          ['Conversion Rate', `${metrics?.conversion_rate || 0}%`],
          ['Success Rate', `${metrics?.success_rate || 0}%`],
          ['Rejection Rate', `${metrics?.rejection_rate || 0}%`],
          ['Total Vacancies', vacancies?.total || 0],
          ['Open Vacancies', vacancies?.open || 0],
          ['Avg Applications / Vacancy', vacancies?.avg_applications || 0],
        ],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        margin: { left: 14, right: 14 },
      });

      // Applications by status
      if (applications?.by_status?.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Status', 'Count']],
          body: applications.by_status.map(s => [s.status, s.count]),
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [124, 58, 237] },
          alternateRowStyles: { fillColor: [250, 245, 255] },
          margin: { left: 14, right: 14 },
          didParseCell: (data) => {
            if (data.section === 'head') return;
            const status = data.row.raw[0];
            const colors = { applied: [59,130,246], reviewing: [245,158,11], shortlisted: [16,185,129], rejected: [239,68,68], hired: [139,92,246] };
            if (colors[status]) data.cell.styles.textColor = colors[status];
          },
        });
      }

      // Application timeline
      if (applications?.timeline?.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Month', 'Applications']],
          body: applications.timeline.map(t => [t.month, t.applications]),
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [22, 163, 74] },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          margin: { left: 14, right: 14 },
        });
      }

      // Vacancy performance
      if (vacancies?.performance?.length > 0) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Vacancy', 'Applications']],
          body: vacancies.performance.map(v => [v.name, v.applications]),
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [245, 158, 11] },
          alternateRowStyles: { fillColor: [255, 251, 235] },
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

      doc.save(`analytics_report_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('PDF exported');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const { applications, vacancies, metrics } = analytics || {};
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Analytics Dashboard Report'],
        [`Generated: ${new Date().toLocaleDateString()}`],
        [],
        ['KEY METRICS', ''],
        ['Total Applications', applications?.total || 0],
        ['Pending Review', applications?.pending || 0],
        ['Shortlisted', applications?.shortlisted || 0],
        ['Hired', applications?.hired || 0],
        ['Conversion Rate (%)', metrics?.conversion_rate || 0],
        ['Success Rate (%)', metrics?.success_rate || 0],
        ['Rejection Rate (%)', metrics?.rejection_rate || 0],
        [],
        ['VACANCIES', ''],
        ['Total Vacancies', vacancies?.total || 0],
        ['Open Vacancies', vacancies?.open || 0],
        ['Avg Applications / Vacancy', vacancies?.avg_applications || 0],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Status breakdown
      if (applications?.by_status?.length > 0) {
        const statusData = [
          ['Status', 'Count'],
          ...applications.by_status.map(s => [s.status, s.count]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(statusData);
        ws2['!cols'] = [{ wch: 20 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'By Status');
      }

      // Timeline
      if (applications?.timeline?.length > 0) {
        const timelineData = [
          ['Month', 'Applications'],
          ...applications.timeline.map(t => [t.month, t.applications]),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(timelineData);
        ws3['!cols'] = [{ wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Timeline');
      }

      // Vacancy performance
      if (vacancies?.performance?.length > 0) {
        const perfData = [
          ['Vacancy', 'Applications'],
          ...vacancies.performance.map(v => [v.name, v.applications]),
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(perfData);
        ws4['!cols'] = [{ wch: 40 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Vacancy Performance');
      }

      XLSX.writeFile(wb, `analytics_report_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Excel exported');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel');
    }
  };

  if (profileLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { applications, vacancies, metrics } = analytics || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive recruitment insights</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <Download className="h-4 w-4" />
                Export Reports
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

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{applications?.total || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {applications?.pending || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.conversion_rate || 0}%</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Applications to hired
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.success_rate || 0}%</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Shortlisted to hired
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Avg Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{vacancies?.avg_applications || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Per vacancy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Application Status Distribution */}
          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Applications by Status</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Distribution of application statuses</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {applications?.by_status?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applications.by_status}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {applications.by_status.map((item, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[item.status] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Application Trends</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Monthly application volume (Last 6 months)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {applications?.timeline?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={applications.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Vacancy Performance */}
          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Vacancy Performance</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Applications per vacancy</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {vacancies?.performance?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vacancies.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No vacancies posted yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Detailed Metrics</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Pending Review</p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Awaiting action</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-500">
                  {applications?.pending || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Shortlisted</p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Under consideration</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-500">
                  {applications?.shortlisted || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Hired</p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Successful hires</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-500">
                  {applications?.hired || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Rejection Rate</p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Applications rejected</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {metrics?.rejection_rate || 0}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
