import { Thermometer, Sun, Droplets, Wind } from 'lucide-react';

function getClimateInfo(lat) {
  const abs = Math.abs(lat);
  let zone, sstRange, uvLevel, rainfall;

  if (abs <= 10) {
    zone = 'Equatorial'; sstRange = '28–30°C'; uvLevel = 'Very High'; rainfall = 'Year-round';
  } else if (abs <= 23.5) {
    zone = 'Tropical'; sstRange = '25–29°C'; uvLevel = 'High'; rainfall = 'Wet / dry seasons';
  } else if (abs <= 35) {
    zone = 'Subtropical'; sstRange = '20–26°C'; uvLevel = 'High'; rainfall = 'Variable';
  } else if (abs <= 50) {
    zone = 'Temperate'; sstRange = '12–20°C'; uvLevel = 'Moderate'; rainfall = 'Distributed';
  } else if (abs <= 66.5) {
    zone = 'Subpolar'; sstRange = '4–12°C'; uvLevel = 'Low'; rainfall = 'Moderate';
  } else {
    zone = 'Polar'; sstRange = '−2–4°C'; uvLevel = 'Very Low'; rainfall = 'Low';
  }

  const month = new Date().getMonth(); // 0-indexed
  const isNorthern = lat >= 0;
  let northernSeason;
  if (month <= 1 || month === 11) northernSeason = 'Winter';
  else if (month <= 4) northernSeason = 'Spring';
  else if (month <= 7) northernSeason = 'Summer';
  else northernSeason = 'Autumn';

  const flip = { Winter: 'Summer', Summer: 'Winter', Spring: 'Autumn', Autumn: 'Spring' };
  const season = isNorthern ? northernSeason : flip[northernSeason];

  const zoneBadge = {
    Equatorial: 'bg-emerald-100 text-emerald-700',
    Tropical: 'bg-green-100 text-green-700',
    Subtropical: 'bg-yellow-100 text-yellow-700',
    Temperate: 'bg-sky-100 text-sky-700',
    Subpolar: 'bg-slate-100 text-slate-600',
    Polar: 'bg-indigo-100 text-indigo-700',
  };

  return { zone, sstRange, uvLevel, rainfall, season, badgeClass: zoneBadge[zone] };
}

export default function ClimateData({ lat, lon }) {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (!lat || !lon || isNaN(latNum) || isNaN(lonNum)) return null;

  const info = getClimateInfo(latNum);

  const stats = [
    { icon: <Thermometer size={14} className="text-orange-500" />, value: info.sstRange, label: 'Sea Surface Temp' },
    { icon: <Sun size={14} className="text-yellow-500" />, value: info.uvLevel, label: 'UV Level' },
    { icon: <Droplets size={14} className="text-sky-500" />, value: info.rainfall, label: 'Rainfall Pattern' },
    { icon: <Wind size={14} className="text-slate-400" />, value: info.season, label: 'Current Season' },
  ];

  return (
    <div className="border border-sky-200 bg-sky-50 rounded-lg p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Sun size={15} className="text-sky-600 shrink-0" />
        <span className="text-sm font-semibold text-sky-800">Climate Preview</span>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${info.badgeClass}`}>
          {info.zone}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(({ icon, value, label }) => (
          <div key={label} className="bg-white rounded-lg p-2.5 text-center shadow-sm">
            <div className="flex justify-center mb-1">{icon}</div>
            <div className="text-xs font-semibold text-slate-800 leading-tight">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2.5">
        Estimates based on {latNum.toFixed(4)}°, {lonNum.toFixed(4)}°. Verify with local data sources.
      </p>
    </div>
  );
}
