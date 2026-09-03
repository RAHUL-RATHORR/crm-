const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/ItemListManagement.jsx',
    find: /className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm\s*focus:outline-none focus:ring-2 focus:ring-blue-500"/g,
    replace: 'className="w-full sm:w-64 bg-indigo-50/50 border border-indigo-200 rounded-lg px-4 py-2 text-indigo-900 placeholder:text-indigo-400 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"'
  },
  {
    file: 'src/RecentDeleted.jsx',
    find: /className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm\s*focus:outline-none focus:ring-2 focus:ring-red-500"/g,
    replace: 'className="w-full sm:w-64 bg-indigo-50/50 border border-indigo-200 rounded-lg px-4 py-2 text-indigo-900 placeholder:text-indigo-400 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"'
  },
  {
    file: 'src/staff/StaffManage.jsx',
    find: /className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"/g,
    replace: 'className="w-full sm:w-64 bg-indigo-50/50 border border-indigo-200 rounded-lg px-4 py-2 text-indigo-900 placeholder:text-indigo-400 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"'
  },
  {
    file: 'src/PaperStockManagement.jsx',
    find: /className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs\s*outline-none focus:ring-2 focus:ring-blue-100"/g,
    replace: 'className="w-full pl-10 pr-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-full text-indigo-900 placeholder:text-indigo-400 text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"'
  }
];

let changedCount = 0;

replacements.forEach(rep => {
  const filePath = path.join(__dirname, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    content = content.replace(rep.find, rep.replace);
    
    // Also change Search icons to indigo
    if (content !== original) {
      content = content.replace(/text-gray-400/g, 'text-indigo-500');
      fs.writeFileSync(filePath, content, 'utf8');
      changedCount++;
      console.log(`Updated ${rep.file}`);
    }
  }
});

console.log(`Changed ${changedCount} more files.`);
