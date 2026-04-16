import React from 'react';
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
  { name: 'Jan', Revenue: 4000, Expenses: 2400 },
  { name: 'Feb', Revenue: 3000, Expenses: 1398 },
  { name: 'Mar', Revenue: 5000, Expenses: 8000 },
  { name: 'Apr', Revenue: 8780, Expenses: 3908 },
  { name: 'May', Revenue: 7890, Expenses: 4800 },
  { name: 'Jun', Revenue: 13900, Expenses: 3800 },
  { name: 'Jul', Revenue: 14900, Expenses: 4300 },
  { name: 'Aug', Revenue: 16000, Expenses: 9800 },
  { name: 'Sep', Revenue: 19000, Expenses: 12000 },
  { name: 'Oct', Revenue: 21000, Expenses: 10080 },
  { name: 'Nov', Revenue: 24000, Expenses: 16000 },
  { name: 'Dec', Revenue: 26000, Expenses: 18000 },
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
              {entry.name}: ₹{(entry.value / 1000).toFixed(1)}k
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
            <div className="bg-white rounded-2xl p-6 h-full min-h-[200px] flex flex-col justify-center shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
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
              <div className="absolute right-0 top-0 h-full w-1/4 sm:w-1/3 opacity-10 bg-gradient-to-l from-teal-500 to-transparent z-0 rounded-r-2xl transform group-hover:scale-105 transition-transform duration-500"></div>
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
                <CountUp end={59526564} prefix="₹" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">-3.5%</span>
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
                <CountUp end={24562564} prefix="₹" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-teal-100 text-teal-600 px-2 py-0.5 rounded text-xs font-semibold">+12.5%</span>
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
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Revenue</div>
                <div className="font-bold text-gray-900">
                  <CountUp end={584000} prefix="₹" />
                </div>
              </div>
              <div className="text-center border-l pl-4 sm:pl-6">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Expenses</div>
                <div className="font-bold text-gray-900">
                  <CountUp end={457000} prefix="₹" />
                </div>
              </div>
              <div className="text-center border-l pl-4 sm:pl-6">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Profit Ratio</div>
                <div className="font-bold text-green-500">
                  <CountUp end={3.6} suffix="%" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} dx={-5} />
                <Tooltip content={customTooltip} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Expenses"
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
              <h3 className="text-lg font-bold text-gray-900">Deals Status</h3>
              <div className="relative" ref={dateDropdownRef}>
                <button
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 flex items-center gap-2 hover:bg-gray-100 transition-all font-medium"
                >
                  <Calendar size={16} className="text-gray-400" />
                  {selectedRange}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDateDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                    {ranges.map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setSelectedRange(range);
                          setIsDateDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedRange === range ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                    <div className="border-t border-gray-50 my-1"></div>
                    <button
                      onClick={() => {
                        setSelectedRange('01 Nov 2023 to 30 Dec 2023');
                        setIsDateDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50"
                    >
                      Custom Range
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium px-2">Name</th>
                    <th className="pb-3 font-medium px-2">Last Contacted</th>
                    <th className="pb-3 font-medium px-2">Sales Representative</th>
                    <th className="pb-3 font-medium px-2">Status</th>
                    <th className="pb-3 font-medium px-2">Deal Value</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {dealsData.map((deal, idx) => (
                    <tr key={idx} className="border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 font-medium">{deal.name}</td>
                      <td className="py-4 px-2 text-gray-500">{deal.date}</td>
                      <td className="py-4 px-2">{deal.salesRep}</td>
                      <td className="py-4 px-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${deal.status === 'Won' ? 'bg-green-100 text-green-700' :
                          deal.status === 'Lost' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-semibold">{deal.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:w-1/3 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Forecast</h3>
            <div className="h-[250px] w-full">
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
