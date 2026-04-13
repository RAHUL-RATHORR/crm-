import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  UserCircle,
  LayoutDashboard,
  Briefcase,
  FileText,
  Truck,
  Wallet,
  Layers,
  FileLock,
  MoreHorizontal,
  ChevronDown,
  List,
  PlusSquare,
  Calculator,
  Settings,
  ChevronRight,
  Building,
  Menu as MenuIcon,
  X as CloseIcon
} from 'lucide-react';
import Dashboard from './Dashboard';
import JobCardForm from './JobCardForm';
import JobCardListing from './JobCardListing';
import AddInvoice from './AddInvoice';
import InvoiceList from './InvoiceList';
import AddChallan from './AddChallan';
import ChallanList from './ChallanList';
import Login from './Login';
import SettingsPage from './Settings';
import SiteSettings from './SiteSettings';
import SocialSettings from './SocialSettings';
import PaymentTypeManagement from './PaymentTypeManagement';
import { LogOut } from 'lucide-react';


const DropdownMenu = ({ title, icon: Icon, items, isActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 h-10 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-nowrap ${isOpen || isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span className="leading-none whitespace-nowrap">{title}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
        />
      </button>

      <div
        className={`absolute top-full left-0 mt-2 min-w-[220px] w-max bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-4px_rgba(0,0,0,0.15)] transition-all duration-200 ease-out z-50 ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-2 invisible'
          }`}
      >
        <div className="p-2 space-y-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="relative group/sub"
              onMouseEnter={() => item.isSubDropdown && setActiveSubMenu(idx)}
              onMouseLeave={() => item.isSubDropdown && setActiveSubMenu(null)}
            >
              <button
                onClick={() => {
                  if (item.isSubDropdown) {
                    setActiveSubMenu(activeSubMenu === idx ? null : idx);
                  } else if (item.onClick) {
                    item.onClick();
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center justify-between w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors group ${activeSubMenu === idx ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={16} className={`${activeSubMenu === idx ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} transition-colors`} />}
                  <span className="font-semibold">{item.label}</span>
                </div>
                {item.isSubDropdown ? (
                  <ChevronRight size={14} className={`${activeSubMenu === idx ? 'text-blue-600 rotate-90 scale-110' : 'text-gray-400 group-hover:text-blue-600'} transition-all`} />
                ) : (
                  item.rightIcon && <item.rightIcon size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                )}
              </button>

              {/* Submenu rendering */}
              {item.isSubDropdown && (activeSubMenu === idx) && (
                <div className="absolute lg:right-[calc(100%-8px)] lg:left-auto lg:top-0 left-0 top-full mt-1 min-w-[180px] bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-4px_rgba(0,0,0,0.15)] p-2 space-y-1 z-[60] animate-in fade-in slide-in-from-right-2 duration-200">
                  {item.subItems.map((sub, sidx) => (
                    <button
                      key={sidx}
                      onClick={() => {
                        sub.onClick();
                        setIsOpen(false);
                        setActiveSubMenu(null);
                      }}
                      className="flex items-center w-full px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Protection
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Site Settings Integration
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('siteSettings');
    return saved ? JSON.parse(saved) : {
      siteTitle: 'TRICKWRICK',
      logo: null,
      whiteLogo: null,
      favicon: null
    };
  });

  useEffect(() => {
    // Update Document Title
    document.title = siteSettings.siteTitle || 'TRICKWRICK';

    // Update Favicon
    if (siteSettings.favicon) {
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = siteSettings.favicon;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = siteSettings.favicon;
        document.getElementsByTagName('head')[0].appendChild(newLink);
      }
    }

    // Listen for manual updates from the settings page
    const handleSettingsUpdate = () => {
      const saved = localStorage.getItem('siteSettings');
      if (saved) setSiteSettings(JSON.parse(saved));
    };

    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
  }, [siteSettings]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // If not logged in, only show Login page
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // If logged in and on /login, redirect to dashboard
  if (isLoggedIn && location.pathname === '/login') {
    return <Routes><Route path="*" element={<Dashboard />} /></Routes>;
  }

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    {
      name: 'Job Card',
      icon: Briefcase,
      isDropdown: true,
      dropdownItems: [
        { label: 'Job Card Listings', icon: List, onClick: () => navigate('/job-card-list') },
        { label: 'Add New', icon: PlusSquare, onClick: () => navigate('/job-card') },
      ],
    },
    {
      name: 'Invoices',
      icon: FileText,
      isDropdown: true,
      dropdownItems: [
        { label: 'Invoice Listings', icon: List, onClick: () => navigate('/invoice/list') },
        { label: 'Add New', icon: PlusSquare, onClick: () => navigate('/invoice/add') },
      ],
    },
    {
      name: 'Challan',
      icon: Truck,
      isDropdown: true,
      dropdownItems: [
        { label: 'Challan Listings', icon: List, onClick: () => navigate('/challan/list') },
        { label: 'Add New', icon: PlusSquare, onClick: () => navigate('/challan/add') },
      ],
    },
    { name: 'Payments', icon: Wallet, path: '/payment-type' },
    { name: 'Paper Stock', icon: Layers },
    { name: 'Statements', icon: FileLock },
    {
      name: 'More',
      icon: MoreHorizontal,
      isDropdown: true,
      dropdownItems: [
        { label: 'Estimate/Quotation', icon: Calculator },
        {
          label: 'Settings',
          icon: Settings,
          isSubDropdown: true,
          subItems: [
            { label: 'Site Setting', onClick: () => navigate('/settings/site') },
            { label: 'Social Setting', onClick: () => navigate('/settings/social') },
            { label: 'Change Password', onClick: () => navigate('/settings/password') },
          ]
        },
      ],
    },
  ];

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('https://crm-qpw8.onrender.com/api/notifications');
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Notif Error:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000); // Polling every 5s for real-time feel
      
      const handleCustomFetch = () => fetchNotifications();
      window.addEventListener('fetchNotifications', handleCustomFetch);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('fetchNotifications', handleCustomFetch);
      };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('https://crm-qpw8.onrender.com/api/notifications/read-all', { method: 'PUT' });
      fetchNotifications();
    } catch (err) {
      console.error("Read Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans pb-10 text-gray-800">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            {isMobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>

          <div className="flex items-center gap-2 text-xl font-bold text-gray-900 tracking-tight">
            {siteSettings.logo ? (
              <img src={siteSettings.logo} alt="Site Logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">
                <Building size={20} />
              </div>
            )}
            <span className="truncate hidden sm:block">{siteSettings.siteTitle || 'TRICKWRICK'}</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-4 whitespace-nowrap flex-nowrap">
          {navigationItems.map((item, idx) => {
            const isActive = location.pathname === item.path || (item.path && location.pathname.startsWith(item.path) && item.path !== '/');

            if (item.isDropdown) {
              return (
                <DropdownMenu
                  key={item.name}
                  title={item.name}
                  icon={item.icon}
                  items={item.dropdownItems}
                  isActive={
                    (item.name === 'Job Card' && location.pathname.includes('/job-card')) ||
                    (item.name === 'Invoices' && location.pathname.includes('/invoice')) ||
                    (item.name === 'Challan' && location.pathname.includes('/challan')) ||
                    (item.name === 'More' && location.pathname.includes('/settings'))
                  }
                />
              );
            }

            return (
              <button
                key={item.name}
                onClick={() => item.path && navigate(item.path)}
                className={`flex items-center gap-2 px-3 h-10 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-nowrap ${isActive || (idx === 0 && location.pathname === '/')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon size={16} className="flex-shrink-0" />
                <span className="leading-none whitespace-nowrap">{item.name}</span>
              </button>
            );
          })}
        </div>

         <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="text-gray-500 hover:text-gray-700 transition p-2 relative flex items-center justify-center"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] h-4 min-w-[16px] flex items-center justify-center font-bold px-1 rounded-full border-2 border-white z-10 shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[60] overflow-hidden transform animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto pl-1 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n._id} 
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        {!n.isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full" />}
                        <p className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-100 transition group relative">
            <UserCircle size={24} className="text-blue-600" />
            {/* <span className="text-sm font-medium hidden md:block"></span> */}

            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
              <div className="p-2">
                <button
                  onClick={() => {
                    localStorage.removeItem('isLoggedIn');
                    navigate('/login');
                    window.location.reload();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300 xl:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
              <CloseIcon size={24} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.isDropdown ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-400 uppercase tracking-wider mt-4 first:mt-0">
                        {item.name}
                      </div>
                      {item.dropdownItems.map((subItem) => (
                        <div key={subItem.label}>
                          {subItem.isSubDropdown ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 first:mt-0 ml-4">
                                {subItem.label}
                              </div>
                              {subItem.subItems.map((ss) => (
                                <button
                                  key={ss.label}
                                  onClick={() => {
                                    if (ss.onClick) ss.onClick();
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="flex items-center gap-3 w-[calc(100%-1.5rem)] ml-6 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"
                                >
                                  {ss.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (subItem.onClick) subItem.onClick();
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition"
                            >
                              {subItem.icon && <subItem.icon size={18} />}
                              {subItem.label}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (item.path) navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition ${location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <item.icon size={18} />
                      {item.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Routing Content */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/job-card" element={<JobCardForm />} />
          <Route path="/job-card-list" element={<JobCardListing />} />
          <Route path="/invoice/add" element={<AddInvoice />} />
          <Route path="/invoice/list" element={<InvoiceList />} />
          <Route path="/challan/add" element={<AddChallan />} />
          <Route path="/challan/list" element={<ChallanList />} />
          <Route path="/settings/password" element={<SettingsPage />} />
          <Route path="/settings/site" element={<SiteSettings />} />
          <Route path="/settings/social" element={<SocialSettings />} />
          <Route path="/payment-type" element={<PaymentTypeManagement />} />
        </Routes>
      </div>
    </div>
  );
}


