import React from 'react';
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Target,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const revenueData = [
  { name: 'Jan', "Monthly Revenue": 4000, "Yearly Revenue": 2400 },
  { name: 'Feb', "Monthly Revenue": 3000, "Yearly Revenue": 1398 },
  { name: 'Mar', "Monthly Revenue": 5000, "Yearly Revenue": 8000 },
  { name: 'Apr', "Monthly Revenue": 8780, "Yearly Revenue": 3908 },
  { name: 'May', "Monthly Revenue": 7890, "Yearly Revenue": 4800 },
  { name: 'Jun', "Monthly Revenue": 13900, "Yearly Revenue": 3800 },
  { name: 'Jul', "Monthly Revenue": 14900, "Yearly Revenue": 4300 },
  { name: 'Aug', "Monthly Revenue": 16000, "Yearly Revenue": 9800 },
  { name: 'Sep', "Monthly Revenue": 19000, "Yearly Revenue": 12000 },
  { name: 'Oct', "Monthly Revenue": 21000, "Yearly Revenue": 10080 },
  { name: 'Nov', "Monthly Revenue": 24000, "Yearly Revenue": 16000 },
  { name: 'Dec', "Monthly Revenue": 26000, "Yearly Revenue": 18000 },
];

const dealsData = [
  {
    name: 'Apple Inc.',
    date: 'Sep 20, 2023',
    salesRep: 'Victoria Rodriguez',
    status: 'Won',
    value: '₹75.5k',
  },
  {
    name: 'Lucasfilm Ltd.',
    date: 'Sep 20, 2023',
    salesRep: 'Victoria Rodriguez',
    status: 'Won',
    value: '₹95.0k',
  },
  {
    name: 'Stark Ind.',
    date: 'Sep 21, 2023',
    salesRep: 'Tony Stark',
    status: 'Lost',
    value: '₹76.36k',
  },
  {
    name: 'Wayne Ent.',
    date: 'Sep 22, 2023',
    salesRep: 'Bruce Wayne',
    status: 'Pending',
    value: '₹140.0k',
  },
  {
    name: 'Oscorp LLC',
    date: 'Sep 23, 2023',
    salesRep: 'Norman Osborn',
    status: 'Won',
    value: '₹120.5k',
  },
];

const forecastData = [
  { name: 'Won', value: 97, fill: '#3b82f6' },
  { name: 'Pending Forecast', value: 36, fill: '#14b8a6' },
  { name: 'Revenue.est', value: 45, fill: '#f59e0b' },
];

const CountUp = ({ end, duration = 2000, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Easing function for smooth finish
      const easeOutQuad = (t) => t * (2 - t);
      const currentCount = Math.floor(easeOutQuad(percentage) * end);

      setCount(currentCount);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span>
      {prefix}{count.toLocaleString('en-IN')}{suffix}
    </span>
  );
};



export default function Dashboard() {
  const navigate = useNavigate();
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('01 Nov 2023 to 30 Dec 2023');
  const dateDropdownRef = useRef(null);

  const [latestJobCards, setLatestJobCards] = useState([]);
  const [loadingJobCards, setLoadingJobCards] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyDiff: 0,
    yearlyRevenue: 0,
    yearlyDiff: 0,
    chartData: []
  });

  useEffect(() => {
    const fetchLatestJobCards = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobcard`);
        if (res.ok) {
          const data = await res.json();
          
          // Sort by createdAt descending and slice to 5 for the latest list
          const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLatestJobCards(sorted.slice(0, 5));
          
          // --- CALCULATE REAL STATS ---
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth(); // 0-indexed

          // Filter jobs for current year, current month, previous month, current year, previous year
          let curMonthSum = 0;
          let prevMonthSum = 0;
          let curYearSum = 0;
          let prevYearSum = 0;

          // Chart data initialization for 12 months of current year
          const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyTotals = Array(12).fill(0);

          data.forEach(card => {
            const cardDate = new Date(card.jobDate || card.createdAt);
            const amt = Number(card.totalAmount) || 0;
            const cardYear = cardDate.getFullYear();
            const cardMonth = cardDate.getMonth();

            // Check current year
            if (cardYear === currentYear) {
              curYearSum += amt;
              monthlyTotals[cardMonth] += amt;
            }

            // Check previous year
            if (cardYear === currentYear - 1) {
              prevYearSum += amt;
            }

            // Check current month & year
            if (cardYear === currentYear && cardMonth === currentMonth) {
              curMonthSum += amt;
            }

            // Check previous month
            const isPrevMonth = (currentMonth === 0) 
              ? (cardYear === currentYear - 1 && cardMonth === 11)
              : (cardYear === currentYear && cardMonth === currentMonth - 1);
            if (isPrevMonth) {
              prevMonthSum += amt;
            }
          });

          // Calculate percentage differences
          let mDiff = 0;
          if (prevMonthSum > 0) {
            mDiff = ((curMonthSum - prevMonthSum) / prevMonthSum) * 100;
          } else if (curMonthSum > 0) {
            mDiff = 100;
          }

          let yDiff = 0;
          if (prevYearSum > 0) {
            yDiff = ((curYearSum - prevYearSum) / prevYearSum) * 100;
          } else if (curYearSum > 0) {
            yDiff = 100;
          }

          // Build cumulative yearly revenue array for the chart
          let cumulativeYearly = 0;
          const chartData = monthsNames.map((name, idx) => {
            cumulativeYearly += monthlyTotals[idx];
            return {
              name,
              "Monthly Revenue": monthlyTotals[idx],
              "Yearly Revenue": cumulativeYearly
            };
          });

          setStats({
            monthlyRevenue: curMonthSum,
            monthlyDiff: mDiff,
            yearlyRevenue: curYearSum,
            yearlyDiff: yDiff,
            chartData
          });
        }
      } catch (err) {
        console.error("Error fetching latest job cards:", err);
      } finally {
        setLoadingJobCards(false);
      }
    };
    fetchLatestJobCards();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ranges = ['Today', 'Last Week', 'Last Month', 'Current Year'];

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Main Content */}
      <main className="mt-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {new Date().getHours() < 12 ? 'Good Morning!' : new Date().getHours() < 17 ? 'Good Afternoon!' : 'Good Evening!'}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">Here's what's happening today in your business.</p>
        </div>

        {/* Cards Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-2xl p-6 h-full min-h-50 flex flex-col justify-center shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  Design, Print, Promote and Build<br className="hidden sm:block" /> your own <span className="text-teal-500">Brand Identity.</span>
                </h2>
                <p className="text-sm text-gray-500 mb-6">Premium printing services for marketing, branding and packaging.</p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => navigate('/job-card')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition shadow-sm hover:shadow shrink-0">
                    Add Card
                  </button>
                  <button 
                    onClick={() => navigate('/paper-stock')}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition shadow-sm hover:shadow shrink-0"
                  >
                    Paper Stock
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/4 sm:w-1/3 opacity-10 bg-linear-to-l from-teal-500 to-transparent z-0 rounded-r-2xl transform group-hover:scale-105 transition-transform duration-500"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:w-1/2">
            {/* Stat Card 1 */}
            <div className="bg-white py-5 px-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Monthly Revenue</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
                <CountUp end={stats.monthlyRevenue} prefix="₹" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stats.monthlyDiff >= 0 ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
                  {stats.monthlyDiff >= 0 ? '+' : ''}{stats.monthlyDiff.toFixed(1)}%
                </span>
                <span className="text-gray-400 text-xs sm:text-sm">vs prev. month</span>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white py-5 px-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center hover:shadow-md transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Yearly Revenue</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
                <CountUp end={stats.yearlyRevenue} prefix="₹" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stats.yearlyDiff >= 0 ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
                  {stats.yearlyDiff >= 0 ? '+' : ''}{stats.yearlyDiff.toFixed(1)}%
                </span>
                <span className="text-gray-400 text-xs sm:text-sm">vs prev. year</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-lg font-bold text-gray-900">Balance Overview</h3>
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Monthly Revenue</div>
                <div className="font-bold text-gray-900">
                  <CountUp end={stats.monthlyRevenue} prefix="₹" />
                </div>
              </div>
              <div className="text-center border-l pl-4 sm:pl-6">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Yearly Revenue</div>
                <div className="font-bold text-gray-900">
                  <CountUp end={stats.yearlyRevenue} prefix="₹" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-62.5 sm:h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} dx={-5} />
                <Tooltip content={customTooltip} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="Monthly Revenue"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Yearly Revenue"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Deals Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Latest Job Cards</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Top 5 recently added job cards</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium px-2">Client Name</th>
                    <th className="pb-3 font-medium px-2">Job Name</th>
                    <th className="pb-3 font-medium px-2">Job Number</th>
                    <th className="pb-3 font-medium px-2">Job Qty</th>
                    <th className="pb-3 font-medium px-2">Job Date</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {loadingJobCards ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 animate-pulse font-medium">
                        Loading Latest Job Cards...
                      </td>
                    </tr>
                  ) : latestJobCards.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 italic">
                        No Job Cards found.
                      </td>
                    </tr>
                  ) : (
                    latestJobCards.map((card, idx) => (
                      <tr key={card._id || idx} className="border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-2 font-bold text-gray-900">{card.partyName}</td>
                        <td className="py-4 px-2 text-gray-700 font-semibold">{card.jobName || 'N/A'}</td>
                        <td className="py-4 px-2">
                          <span className="font-mono text-xs text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded font-bold">
                            {card.jobNumber || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-semibold text-gray-900">
                          {Number(card.jobQty || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-2 text-gray-500 font-medium">
                          {new Date(card.jobDate || card.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:w-1/3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Forecast</h3>
            <div className="h-62.5 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `${val}k`} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {forecastData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {forecastData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.fill }}></div>
                  {entry.name.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
