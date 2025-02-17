import React, { useEffect, useState } from 'react';
import { Award, Users, ScrollText, Eye } from 'lucide-react';
import { eventService } from '@/api/services/event.service';

interface EventStats {
  totalEvents: number;
  totalParticipants: number;
  certificatesGenerated: number;
  totalPageViews: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    totalParticipants: 0,
    certificatesGenerated: 0,
    totalPageViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await eventService.getOrganizerStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      label: 'Total Events',
      value: stats.totalEvents.toString(),
      icon: Award,
      color: 'from-pink-500 to-rose-500'
    },
    {
      label: 'Total Participants',
      value: stats.totalParticipants.toString(),
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Certificates Generated',
      value: stats.certificatesGenerated.toString(),
      icon: ScrollText,
      color: 'from-violet-500 to-purple-500'
    },
    {
      label: 'Total Page Views',
      value: stats.totalPageViews.toString(),
      icon: Eye,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-zinc-900/50 rounded-lg p-6 animate-pulse h-32" />
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat) => (
        <div
          key={stat.label}
          className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color} bg-opacity-10`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}