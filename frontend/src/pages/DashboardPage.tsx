import { useEffect, useState } from 'react';
import { StreakCounter } from '../components/dashboard/StreakCounter';
import { DailyMission } from '../components/dashboard/DailyMission';
import { BandEstimate } from '../components/dashboard/BandEstimate';
import { ContributionHeatmap } from '../components/dashboard/ContributionHeatmap';
import { FeatureCards } from '../components/dashboard/FeatureCards';
import { ForecastProgress } from '../components/dashboard/ForecastProgress';
import api from '../lib/api';

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/user/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium animate-pulse">Đang tải dữ liệu học tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-heading text-white tracking-tight drop-shadow-sm">
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-text-secondary mt-2 text-lg font-medium opacity-80">
            Hôm nay bạn đã sẵn sàng nâng band IELTS chưa?
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <StreakCounter currentStreak={dashboardData.streak} />
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DailyMission 
          completedQuestions={dashboardData.dailyMission.completed} 
          totalQuestions={dashboardData.dailyMission.total} 
        />
        
        <BandEstimate 
          currentBand={dashboardData.bandEstimate.current}
          change={dashboardData.bandEstimate.change}
          tips={dashboardData.bandEstimate.tips}
        />

        <ForecastProgress progress={dashboardData.forecast} />
      </div>

      {/* Heatmap Section */}
      <ContributionHeatmap data={dashboardData.heatmap} />

      {/* Feature Navigation Cards */}
      <FeatureCards />
      
      {/* Footer / Extra info or Motivation */}
      <footer className="pt-8 pb-4 text-center">
         <p className="text-text-secondary text-sm font-medium italic opacity-50">
           "The expert in anything was once a beginner." — Helen Hayes
         </p>
      </footer>
    </div>
  );
}
