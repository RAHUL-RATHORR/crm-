import React from 'react';
import { Phone, Mail } from 'lucide-react';

const TRICKWRICK = {
  website: 'https://www.trickwrick.com/',
  email: 'info@trickwrick.com',
};

const MAINTENANCE_POINTS = [
  'If you require any new major features or additional development in the future, the cost will be calculated separately based on the agreed scope of work.',
  'Annual Server Maintenance Charges (AMC), as mentioned in the invoice shared with you via email, will be billed annually starting from the software activation date.',
];

const ContactSupport = () => (
  <div className="mx-auto mt-8 pb-12 max-w-7xl w-full px-4 sm:px-6 space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full">
      <div className="h-1.5 bg-linear-to-r from-[#0c3d6e] via-[#1a5a9e] to-[#5ec6e8]" />

      <div className="px-8 sm:px-12 lg:px-16 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#0c3d6e] mb-8">
          Contact &amp; Support
        </h1>

        <div className="flex flex-col items-start gap-3 mb-6">
          <a
            href={TRICKWRICK.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 border border-[#0c3d6e] rounded-sm px-5 py-3 text-[#0c3d6e] font-medium w-fit hover:bg-blue-50/40 transition-colors"
          >
            <Phone size={20} className="shrink-0" strokeWidth={2} />
            <span>+91 97728 21573</span>
          </a>

          <a
            href={`mailto:${TRICKWRICK.email}`}
            className="inline-flex items-center gap-3 border border-[#0c3d6e] rounded-sm px-5 py-3 text-[#0c3d6e] font-medium w-fit hover:bg-blue-50/40 transition-colors"
          >
            <Mail size={20} className="shrink-0" strokeWidth={2} />
            <span>{TRICKWRICK.email}</span>
          </a>
        </div>

        <p className="text-sm font-bold text-[#0c3d6e] mb-4">
          Printing Press Management Software
        </p>

        <p className="text-sm text-gray-500 leading-relaxed">
        This software is designed and developed by Trickwrick Infotech Private Limited.
        <br></br> 
        © Copyright {new Date().getFullYear()} Trickwrick. All Right Reserved
        </p>
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 w-full px-8 sm:px-12 lg:px-16 py-8 sm:py-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
        Software Information
      </h2>
      <div className="space-y-3 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <span className="text-sm font-semibold text-gray-600">Software Activated/Purchased On:</span>
          <span className="text-sm font-bold text-gray-900">01 July 2026</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <span className="text-sm font-semibold text-gray-600">Subscription Type:</span>
          <span className="text-sm font-bold text-gray-900">Annual</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <span className="text-sm font-semibold text-gray-600">Status:</span>
          <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-2 w-fit"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>Active</span>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow-sm border border-gray-100 w-full px-8 sm:px-12 lg:px-16 py-8 sm:py-10">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
        Support &amp; Maintenance:
      </h2>

      <ul className="space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed list-none">
        {MAINTENANCE_POINTS.map((point) => (
          <li key={point} className="flex gap-3">
            <span className="text-[#0c3d6e] font-bold shrink-0">-</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default ContactSupport;
