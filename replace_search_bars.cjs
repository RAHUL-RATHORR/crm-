const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.jsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('src');
let changedCount = 0;

const searchClassReplacements = [
  // 1. JobCardListing.jsx / ItemListManagement.jsx
  {
    find: /className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"/g,
    replace: 'className="w-full pl-10 pr-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 text-indigo-900 placeholder:text-indigo-400 text-sm transition-all"'
  },
  // 2. Estimates.jsx
  {
    find: /className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500\/20 focus:border-orange-500\/50 text-sm transition-all"/g,
    replace: 'className="w-full pl-12 pr-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-indigo-900 placeholder:text-indigo-400 text-sm transition-all"'
  },
  // 3. Statements.jsx & PaperStockStatements.jsx
  {
    find: /className="w-full pl-10 pr-4 py-2\.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500\/20"/g,
    replace: 'className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-400"'
  },
  {
    find: /className="w-full pl-10 pr-4 py-2\.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500\/10 transition-all shadow-sm"/g,
    replace: 'className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-400 transition-all shadow-sm"'
  },
  // 4. StaffManage.jsx
  {
    find: /className="w-full pl-10 pr-4 py-2\.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500\/20 transition-all"/g,
    replace: 'className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-400 transition-all"'
  },
  // 5. RecentDeleted.jsx
  {
    find: /className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500\/20 transition-all"/g,
    replace: 'className="w-full pl-10 pr-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-400 transition-all"'
  },
  // 6. PaperStockManagement.jsx
  {
    find: /className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500\/20 transition-all"/g,
    replace: 'className="w-full pl-9 pr-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-indigo-900 placeholder:text-indigo-400 transition-all"'
  }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace input classes
  searchClassReplacements.forEach(rep => {
    content = content.replace(rep.find, rep.replace);
  });

  // Replace Search icon colors for the search bars
  // Look for `<Search ... text-gray-400` or `text-gray-500` near a search input
  // A simpler way: if the file has a search input replacement, replace all Search icons that are gray with indigo
  if (content !== original) {
    content = content.replace(/text-gray-400(.*?)(\/?>)/g, (match, p1, p2) => {
      if (original.includes('Search') && match.length < 50) {
        return `text-indigo-500${p1}${p2}`;
      }
      return match;
    });
    content = content.replace(/<Search([^>]+)text-gray-500/g, '<Search$1text-indigo-500');
    content = content.replace(/<Search([^>]+)text-gray-400/g, '<Search$1text-indigo-500');
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Changed ${changedCount} files.`);
