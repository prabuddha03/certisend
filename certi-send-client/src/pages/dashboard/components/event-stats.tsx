import { Event } from '@/types/event.types';
import { Card } from '@/components/ui/card';
import { Users, UserCheck, Eye, Award, Clock } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Props {
  event: Event;
}

export function EventStats({ event }: Props) {
  // Sample data - replace with real data from your API
  const registrationData = [
    { date: '2024-01', registrations: 12 },
    { date: '2024-02', registrations: 19 },
    { date: '2024-03', registrations: 25 },
    // ... more data
  ];

  const statsConfig = [
    {
      title: "Total Registrations",
      value: event.totalRegistrations || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Approved Participants",
      value: event.approvedParticipants || 0,
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
      show: event.isApprovalRequired
    },
    {
      title: "Page Views",
      value: event.pageViews || 0,
      icon: Eye,
      color: "from-purple-500 to-violet-500"
    },
    {
      title: "Certificates Issued",
      value: event.certificatesIssued || 0,
      icon: Award,
      color: "from-orange-500 to-amber-500"
    }
  ].filter(stat => !stat.show || stat.show === true);

  return (
    <div className="p-6 space-y-8">
      <h3 className="text-lg font-semibold mb-6">Event Analytics</h3>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="p-6 bg-zinc-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
