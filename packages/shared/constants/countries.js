// Coastal nations relevant to marine infrastructure
// Each entry: { id, name, lat, lon (country center), jurisdictionId, cities[] }
// Cities: major coastal locations with coordinates for auto-fill

export const COUNTRIES = [
  {
    id: 'us', name: 'United States', lat: 37.09, lon: -95.71, jurisdictionId: 'us_federal',
    cities: [
      { name: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
      { name: 'San Diego, CA', lat: 32.7157, lon: -117.1611 },
      { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
      { name: 'Boston, MA', lat: 42.3601, lon: -71.0589 },
      { name: 'Galveston, TX', lat: 29.3013, lon: -94.7977 },
      { name: 'New York, NY', lat: 40.7128, lon: -74.0060 },
      { name: 'Los Angeles, CA', lat: 33.9425, lon: -118.4081 },
      { name: 'New Orleans, LA', lat: 29.9511, lon: -90.0715 },
      { name: 'Honolulu, HI', lat: 21.3069, lon: -157.8583 },
      { name: 'Anchorage, AK', lat: 61.2181, lon: -149.9003 },
    ],
  },
  {
    id: 'il', name: 'Israel', lat: 31.0461, lon: 34.8516, jurisdictionId: 'israel',
    cities: [
      { name: 'Haifa', lat: 32.7940, lon: 34.9896 },
      { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818 },
      { name: 'Herzliya', lat: 32.1663, lon: 34.8438 },
      { name: 'Ashkelon', lat: 31.6689, lon: 34.5747 },
      { name: 'Eilat', lat: 29.5577, lon: 34.9519 },
      { name: 'Caesarea', lat: 32.5046, lon: 34.8939 },
      { name: 'Netanya', lat: 32.3226, lon: 34.8534 },
    ],
  },
  {
    id: 'gb', name: 'United Kingdom', lat: 55.3781, lon: -3.4360, jurisdictionId: 'uk',
    cities: [
      { name: 'London (Thames)', lat: 51.5074, lon: -0.1278 },
      { name: 'Portsmouth', lat: 50.7989, lon: -1.0912 },
      { name: 'Plymouth', lat: 50.3755, lon: -4.1427 },
      { name: 'Liverpool', lat: 53.4084, lon: -2.9916 },
      { name: 'Bristol', lat: 51.4545, lon: -2.5879 },
      { name: 'Aberdeen', lat: 57.1497, lon: -2.0943 },
      { name: 'Belfast', lat: 54.5973, lon: -5.9301 },
      { name: 'Cardiff', lat: 51.4816, lon: -3.1791 },
      { name: 'Falmouth', lat: 50.1536, lon: -5.0687 },
    ],
  },
  {
    id: 'au', name: 'Australia', lat: -25.2744, lon: 133.7751, jurisdictionId: 'australia',
    cities: [
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
      { name: 'Brisbane', lat: -27.4698, lon: 153.0251 },
      { name: 'Perth', lat: -31.9505, lon: 115.8605 },
      { name: 'Adelaide', lat: -34.9285, lon: 138.6007 },
      { name: 'Darwin', lat: -12.4634, lon: 130.8456 },
      { name: 'Cairns', lat: -16.9186, lon: 145.7781 },
      { name: 'Hobart', lat: -42.8821, lon: 147.3272 },
      { name: 'Townsville', lat: -19.2590, lon: 146.8169 },
    ],
  },
  {
    id: 'nl', name: 'Netherlands', lat: 52.1326, lon: 5.2913, jurisdictionId: 'eu',
    cities: [
      { name: 'Rotterdam', lat: 51.9244, lon: 4.4777 },
      { name: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
      { name: 'Den Helder', lat: 52.9563, lon: 4.7622 },
      { name: 'Vlissingen', lat: 51.4428, lon: 3.5717 },
      { name: 'IJmuiden', lat: 52.4580, lon: 4.6053 },
      { name: 'Harlingen', lat: 53.1749, lon: 5.4194 },
    ],
  },
  {
    id: 'no', name: 'Norway', lat: 60.4720, lon: 8.4689, jurisdictionId: null,
    cities: [
      { name: 'Oslo', lat: 59.9139, lon: 10.7522 },
      { name: 'Bergen', lat: 60.3913, lon: 5.3221 },
      { name: 'Stavanger', lat: 58.9700, lon: 5.7331 },
      { name: 'Tromsø', lat: 69.6489, lon: 18.9551 },
      { name: 'Trondheim', lat: 63.4305, lon: 10.3951 },
      { name: 'Ålesund', lat: 62.4723, lon: 6.1549 },
      { name: 'Bodø', lat: 67.2804, lon: 14.4049 },
    ],
  },
  {
    id: 'dk', name: 'Denmark', lat: 56.2639, lon: 9.5018, jurisdictionId: 'eu',
    cities: [
      { name: 'Copenhagen', lat: 55.6761, lon: 12.5683 },
      { name: 'Esbjerg', lat: 55.4762, lon: 8.4594 },
      { name: 'Aarhus', lat: 56.1629, lon: 10.2039 },
      { name: 'Aalborg', lat: 57.0488, lon: 9.9217 },
      { name: 'Odense', lat: 55.4038, lon: 10.4024 },
      { name: 'Frederikshavn', lat: 57.4407, lon: 10.5365 },
    ],
  },
  {
    id: 'jp', name: 'Japan', lat: 36.2048, lon: 138.2529, jurisdictionId: null,
    cities: [
      { name: 'Tokyo (Tokyo Bay)', lat: 35.6762, lon: 139.6503 },
      { name: 'Osaka', lat: 34.6937, lon: 135.5023 },
      { name: 'Yokohama', lat: 35.4437, lon: 139.6380 },
      { name: 'Kobe', lat: 34.6901, lon: 135.1956 },
      { name: 'Nagoya', lat: 35.1815, lon: 136.9066 },
      { name: 'Hiroshima', lat: 34.3853, lon: 132.4553 },
      { name: 'Fukuoka', lat: 33.5904, lon: 130.4017 },
      { name: 'Naha (Okinawa)', lat: 26.2124, lon: 127.6809 },
    ],
  },
  {
    id: 'kr', name: 'South Korea', lat: 35.9078, lon: 127.7669, jurisdictionId: null,
    cities: [
      { name: 'Busan', lat: 35.1796, lon: 129.0756 },
      { name: 'Incheon', lat: 37.4563, lon: 126.7052 },
      { name: 'Ulsan', lat: 35.5384, lon: 129.3114 },
      { name: 'Pohang', lat: 36.0190, lon: 129.3435 },
      { name: 'Mokpo', lat: 34.8118, lon: 126.3922 },
      { name: 'Yeosu', lat: 34.7604, lon: 127.6622 },
    ],
  },
  {
    id: 'sg', name: 'Singapore', lat: 1.3521, lon: 103.8198, jurisdictionId: null,
    cities: [
      { name: 'Singapore (South)', lat: 1.2644, lon: 103.8222 },
      { name: 'Jurong Island', lat: 1.2645, lon: 103.7004 },
      { name: 'Changi', lat: 1.3590, lon: 103.9870 },
      { name: 'Sembawang', lat: 1.4491, lon: 103.8185 },
      { name: 'Tuas', lat: 1.3010, lon: 103.6369 },
    ],
  },
  {
    id: 'ae', name: 'UAE', lat: 23.4241, lon: 53.8478, jurisdictionId: null,
    cities: [
      { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
      { name: 'Abu Dhabi', lat: 24.4539, lon: 54.3773 },
      { name: 'Sharjah', lat: 25.3463, lon: 55.4209 },
      { name: 'Ras Al Khaimah', lat: 25.7895, lon: 55.9432 },
      { name: 'Fujairah', lat: 25.1288, lon: 56.3264 },
      { name: 'Ajman', lat: 25.4052, lon: 55.5136 },
    ],
  },
  {
    id: 'sa', name: 'Saudi Arabia', lat: 23.8859, lon: 45.0792, jurisdictionId: null,
    cities: [
      { name: 'Jeddah', lat: 21.4858, lon: 39.1925 },
      { name: 'Dammam', lat: 26.4207, lon: 50.0888 },
      { name: 'Jubail', lat: 27.0046, lon: 49.6581 },
      { name: 'Yanbu', lat: 24.0895, lon: 38.0618 },
      { name: 'Dhahran', lat: 26.2361, lon: 50.1988 },
    ],
  },
  {
    id: 'br', name: 'Brazil', lat: -14.2350, lon: -51.9253, jurisdictionId: null,
    cities: [
      { name: 'Santos', lat: -23.9618, lon: -46.3322 },
      { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
      { name: 'Salvador', lat: -12.9777, lon: -38.5016 },
      { name: 'Fortaleza', lat: -3.7172, lon: -38.5433 },
      { name: 'Recife', lat: -8.0578, lon: -34.8829 },
      { name: 'Vitória', lat: -20.2976, lon: -40.2958 },
      { name: 'Manaus (Amazon)', lat: -3.1190, lon: -60.0217 },
    ],
  },
  {
    id: 'mx', name: 'Mexico', lat: 23.6345, lon: -102.5528, jurisdictionId: null,
    cities: [
      { name: 'Veracruz', lat: 19.1738, lon: -96.1342 },
      { name: 'Cancún', lat: 21.1619, lon: -86.8515 },
      { name: 'Manzanillo', lat: 19.0523, lon: -104.3148 },
      { name: 'Ensenada', lat: 31.8667, lon: -116.5960 },
      { name: 'Tampico', lat: 22.2337, lon: -97.8475 },
      { name: 'Mazatlán', lat: 23.2494, lon: -106.4111 },
      { name: 'Salina Cruz', lat: 16.1735, lon: -95.1997 },
    ],
  },
  {
    id: 'es', name: 'Spain', lat: 40.4637, lon: -3.7492, jurisdictionId: 'eu',
    cities: [
      { name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
      { name: 'Valencia', lat: 39.4699, lon: -0.3763 },
      { name: 'Bilbao', lat: 43.2630, lon: -2.9340 },
      { name: 'Algeciras', lat: 36.1280, lon: -5.4547 },
      { name: 'Las Palmas (Canary Is.)', lat: 28.1235, lon: -15.4363 },
      { name: 'Palma de Mallorca', lat: 39.5696, lon: 2.6502 },
      { name: 'Cádiz', lat: 36.5270, lon: -6.2886 },
      { name: 'Vigo', lat: 42.2314, lon: -8.7124 },
    ],
  },
  {
    id: 'fr', name: 'France', lat: 46.2276, lon: 2.2137, jurisdictionId: 'eu',
    cities: [
      { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
      { name: 'Le Havre', lat: 49.4938, lon: 0.1077 },
      { name: 'Bordeaux', lat: 44.8378, lon: -0.5792 },
      { name: 'Toulon', lat: 43.1242, lon: 5.9280 },
      { name: 'Brest', lat: 48.3904, lon: -4.4861 },
      { name: 'Dunkirk', lat: 51.0342, lon: 2.3775 },
      { name: 'Nice', lat: 43.7102, lon: 7.2620 },
    ],
  },
  {
    id: 'it', name: 'Italy', lat: 41.8719, lon: 12.5674, jurisdictionId: 'eu',
    cities: [
      { name: 'Genoa', lat: 44.4056, lon: 8.9463 },
      { name: 'Naples', lat: 40.8518, lon: 14.2681 },
      { name: 'Venice', lat: 45.4408, lon: 12.3155 },
      { name: 'Trieste', lat: 45.6495, lon: 13.7768 },
      { name: 'Palermo', lat: 38.1157, lon: 13.3615 },
      { name: 'Ancona', lat: 43.6158, lon: 13.5189 },
      { name: 'Catania', lat: 37.5079, lon: 15.0830 },
      { name: 'Taranto', lat: 40.4644, lon: 17.2470 },
    ],
  },
  {
    id: 'gr', name: 'Greece', lat: 39.0742, lon: 21.8243, jurisdictionId: 'eu',
    cities: [
      { name: 'Piraeus (Athens)', lat: 37.9415, lon: 23.6471 },
      { name: 'Thessaloniki', lat: 40.6401, lon: 22.9444 },
      { name: 'Heraklion (Crete)', lat: 35.3387, lon: 25.1442 },
      { name: 'Patras', lat: 38.2466, lon: 21.7346 },
      { name: 'Rhodes', lat: 36.4349, lon: 28.2176 },
      { name: 'Corfu', lat: 39.6243, lon: 19.9217 },
      { name: 'Kavala', lat: 40.9393, lon: 24.4023 },
    ],
  },
  {
    id: 'tr', name: 'Turkey', lat: 38.9637, lon: 35.2433, jurisdictionId: null,
    cities: [
      { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
      { name: 'Izmir', lat: 38.4192, lon: 27.1287 },
      { name: 'Mersin', lat: 36.8121, lon: 34.6415 },
      { name: 'Trabzon', lat: 41.0015, lon: 39.7178 },
      { name: 'Antalya', lat: 36.8969, lon: 30.7133 },
      { name: 'Bodrum', lat: 37.0344, lon: 27.4305 },
    ],
  },
  {
    id: 'eg', name: 'Egypt', lat: 26.8206, lon: 30.8025, jurisdictionId: null,
    cities: [
      { name: 'Alexandria', lat: 31.2001, lon: 29.9187 },
      { name: 'Port Said', lat: 31.2565, lon: 32.2841 },
      { name: 'Suez', lat: 29.9668, lon: 32.5498 },
      { name: 'Hurghada', lat: 27.2579, lon: 33.8116 },
      { name: 'Sharm el-Sheikh', lat: 27.9158, lon: 34.3300 },
      { name: 'Damietta', lat: 31.4165, lon: 31.8133 },
    ],
  },
  {
    id: 'za', name: 'South Africa', lat: -30.5595, lon: 22.9375, jurisdictionId: null,
    cities: [
      { name: 'Durban', lat: -29.8587, lon: 31.0218 },
      { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
      { name: 'Port Elizabeth', lat: -33.9608, lon: 25.6022 },
      { name: 'East London', lat: -33.0153, lon: 27.9116 },
      { name: 'Richards Bay', lat: -28.7555, lon: 32.0587 },
      { name: 'Mossel Bay', lat: -34.1823, lon: 22.1423 },
    ],
  },
  {
    id: 'in', name: 'India', lat: 20.5937, lon: 78.9629, jurisdictionId: null,
    cities: [
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Kochi', lat: 9.9312, lon: 76.2673 },
      { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
      { name: 'Paradip', lat: 20.3163, lon: 86.6091 },
      { name: 'Kandla', lat: 23.0333, lon: 70.2167 },
      { name: 'Mangalore', lat: 12.9141, lon: 74.8560 },
    ],
  },
  {
    id: 'th', name: 'Thailand', lat: 15.8700, lon: 100.9925, jurisdictionId: null,
    cities: [
      { name: 'Bangkok (Laem Chabang)', lat: 13.0579, lon: 100.8813 },
      { name: 'Phuket', lat: 7.8804, lon: 98.3923 },
      { name: 'Pattaya', lat: 12.9236, lon: 100.8825 },
      { name: 'Surat Thani', lat: 9.1382, lon: 99.3220 },
      { name: 'Songkhla', lat: 7.1756, lon: 100.6130 },
    ],
  },
  {
    id: 'id', name: 'Indonesia', lat: -0.7893, lon: 113.9213, jurisdictionId: null,
    cities: [
      { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
      { name: 'Surabaya', lat: -7.2575, lon: 112.7521 },
      { name: 'Makassar', lat: -5.1477, lon: 119.4327 },
      { name: 'Medan (Belawan)', lat: 3.7931, lon: 98.6722 },
      { name: 'Balikpapan', lat: -1.2675, lon: 116.8289 },
      { name: 'Bali (Benoa)', lat: -8.7469, lon: 115.2167 },
      { name: 'Batam', lat: 1.0456, lon: 104.0305 },
    ],
  },
  {
    id: 'ph', name: 'Philippines', lat: 12.8797, lon: 121.7740, jurisdictionId: null,
    cities: [
      { name: 'Manila', lat: 14.5995, lon: 120.9842 },
      { name: 'Cebu City', lat: 10.3157, lon: 123.8854 },
      { name: 'Davao', lat: 7.1907, lon: 125.4553 },
      { name: 'Subic Bay', lat: 14.8038, lon: 120.2690 },
      { name: 'Batangas', lat: 13.7565, lon: 121.0583 },
      { name: 'Cagayan de Oro', lat: 8.4542, lon: 124.6319 },
    ],
  },
  {
    id: 'nz', name: 'New Zealand', lat: -40.9006, lon: 174.8860, jurisdictionId: null,
    cities: [
      { name: 'Auckland', lat: -36.8485, lon: 174.7633 },
      { name: 'Wellington', lat: -41.2924, lon: 174.7787 },
      { name: 'Christchurch', lat: -43.5321, lon: 172.6362 },
      { name: 'Tauranga', lat: -37.6870, lon: 176.1651 },
      { name: 'Nelson', lat: -41.2706, lon: 173.2840 },
      { name: 'Dunedin', lat: -45.8788, lon: 170.5028 },
    ],
  },
  {
    id: 'ca', name: 'Canada', lat: 56.1304, lon: -106.3468, jurisdictionId: null,
    cities: [
      { name: 'Vancouver, BC', lat: 49.2827, lon: -123.1207 },
      { name: 'Halifax, NS', lat: 44.6488, lon: -63.5752 },
      { name: 'St. John\'s, NL', lat: 47.5615, lon: -52.7126 },
      { name: 'Victoria, BC', lat: 48.4284, lon: -123.3656 },
      { name: 'Montreal, QC', lat: 45.5017, lon: -73.5673 },
      { name: 'Prince Rupert, BC', lat: 54.3150, lon: -130.3208 },
      { name: 'Saint John, NB', lat: 45.2733, lon: -66.0633 },
    ],
  },
  {
    id: 'de', name: 'Germany', lat: 51.1657, lon: 10.4515, jurisdictionId: 'eu',
    cities: [
      { name: 'Hamburg', lat: 53.5753, lon: 10.0153 },
      { name: 'Bremen', lat: 53.0793, lon: 8.8017 },
      { name: 'Kiel', lat: 54.3233, lon: 10.1228 },
      { name: 'Rostock', lat: 54.0924, lon: 12.0991 },
      { name: 'Bremerhaven', lat: 53.5396, lon: 8.5809 },
      { name: 'Lübeck', lat: 53.8655, lon: 10.6866 },
    ],
  },
  {
    id: 'pt', name: 'Portugal', lat: 39.3999, lon: -8.2245, jurisdictionId: 'eu',
    cities: [
      { name: 'Lisbon (Setúbal)', lat: 38.7169, lon: -9.1399 },
      { name: 'Porto (Leixões)', lat: 41.1917, lon: -8.7043 },
      { name: 'Sines', lat: 37.9560, lon: -8.8721 },
      { name: 'Faro', lat: 37.0194, lon: -7.9322 },
      { name: 'Funchal (Madeira)', lat: 32.6669, lon: -16.9241 },
      { name: 'Ponta Delgada (Azores)', lat: 37.7412, lon: -25.6756 },
    ],
  },
  {
    id: 'hr', name: 'Croatia', lat: 45.1000, lon: 15.2000, jurisdictionId: 'eu',
    cities: [
      { name: 'Split', lat: 43.5081, lon: 16.4402 },
      { name: 'Rijeka', lat: 45.3271, lon: 14.4422 },
      { name: 'Dubrovnik', lat: 42.6507, lon: 18.0944 },
      { name: 'Zadar', lat: 44.1194, lon: 15.2314 },
      { name: 'Pula', lat: 44.8683, lon: 13.8481 },
      { name: 'Šibenik', lat: 43.7350, lon: 15.8952 },
    ],
  },
  {
    id: 'ma', name: 'Morocco', lat: 31.7917, lon: -7.0926, jurisdictionId: null,
    cities: [
      { name: 'Casablanca', lat: 33.5731, lon: -7.5898 },
      { name: 'Tangier', lat: 35.7671, lon: -5.7997 },
      { name: 'Agadir', lat: 30.4278, lon: -9.5981 },
      { name: 'Nador', lat: 35.1741, lon: -2.9286 },
      { name: 'Mohammedia', lat: 33.6861, lon: -7.3836 },
      { name: 'Dakhla', lat: 23.7199, lon: -15.9361 },
    ],
  },
  {
    id: 'tn', name: 'Tunisia', lat: 33.8869, lon: 9.5375, jurisdictionId: null,
    cities: [
      { name: 'Tunis (La Goulette)', lat: 36.8190, lon: 10.3059 },
      { name: 'Sfax', lat: 34.7398, lon: 10.7600 },
      { name: 'Sousse', lat: 35.8288, lon: 10.6405 },
      { name: 'Bizerte', lat: 37.2746, lon: 9.8739 },
      { name: 'Gabès', lat: 33.8828, lon: 10.0980 },
    ],
  },
  {
    id: 'cl', name: 'Chile', lat: -35.6751, lon: -71.5430, jurisdictionId: null,
    cities: [
      { name: 'Valparaíso', lat: -33.0458, lon: -71.6197 },
      { name: 'San Antonio', lat: -33.5933, lon: -71.6089 },
      { name: 'Iquique', lat: -20.2208, lon: -70.1431 },
      { name: 'Antofagasta', lat: -23.6509, lon: -70.3975 },
      { name: 'Puerto Montt', lat: -41.4693, lon: -72.9424 },
      { name: 'Punta Arenas', lat: -53.1638, lon: -70.9171 },
    ],
  },
  {
    id: 'co', name: 'Colombia', lat: 4.5709, lon: -74.2973, jurisdictionId: null,
    cities: [
      { name: 'Barranquilla', lat: 10.9685, lon: -74.7813 },
      { name: 'Cartagena', lat: 10.3910, lon: -75.4794 },
      { name: 'Santa Marta', lat: 11.2408, lon: -74.1990 },
      { name: 'Buenaventura', lat: 3.8801, lon: -77.0311 },
      { name: 'Tumaco', lat: 1.7994, lon: -78.7602 },
    ],
  },
  {
    id: 'pa', name: 'Panama', lat: 8.9936, lon: -79.5197, jurisdictionId: null,
    cities: [
      { name: 'Panama City', lat: 8.9936, lon: -79.5197 },
      { name: 'Colón', lat: 9.3594, lon: -79.9007 },
      { name: 'Balboa', lat: 8.9621, lon: -79.5661 },
      { name: 'Cristóbal', lat: 9.3502, lon: -79.9183 },
    ],
  },
  {
    id: 'cr', name: 'Costa Rica', lat: 9.7489, lon: -83.7534, jurisdictionId: null,
    cities: [
      { name: 'Puerto Limón', lat: 9.9922, lon: -83.0420 },
      { name: 'Caldera', lat: 9.9003, lon: -84.7139 },
      { name: 'Quepos', lat: 9.4319, lon: -84.1697 },
      { name: 'Puntarenas', lat: 9.9787, lon: -84.8297 },
    ],
  },
  {
    id: 'ie', name: 'Ireland', lat: 53.4129, lon: -8.2439, jurisdictionId: 'eu',
    cities: [
      { name: 'Dublin', lat: 53.3498, lon: -6.2603 },
      { name: 'Cork', lat: 51.8985, lon: -8.4756 },
      { name: 'Galway', lat: 53.2707, lon: -9.0568 },
      { name: 'Limerick (Shannon)', lat: 52.6638, lon: -8.6267 },
      { name: 'Waterford', lat: 52.2593, lon: -7.1101 },
    ],
  },
  {
    id: 'se', name: 'Sweden', lat: 60.1282, lon: 18.6435, jurisdictionId: 'eu',
    cities: [
      { name: 'Gothenburg', lat: 57.7089, lon: 11.9746 },
      { name: 'Stockholm', lat: 59.3293, lon: 18.0686 },
      { name: 'Malmö', lat: 55.6050, lon: 13.0038 },
      { name: 'Gävle', lat: 60.6750, lon: 17.1417 },
      { name: 'Helsingborg', lat: 56.0465, lon: 12.6945 },
    ],
  },
  {
    id: 'fi', name: 'Finland', lat: 61.9241, lon: 25.7482, jurisdictionId: 'eu',
    cities: [
      { name: 'Helsinki', lat: 60.1699, lon: 24.9384 },
      { name: 'Turku', lat: 60.4518, lon: 22.2666 },
      { name: 'Oulu', lat: 65.0121, lon: 25.4651 },
      { name: 'Tampere (Pori)', lat: 51.4980, lon: 21.7977 },
      { name: 'Kotka', lat: 60.4668, lon: 26.9458 },
    ],
  },
  {
    id: 'be', name: 'Belgium', lat: 50.5039, lon: 4.4699, jurisdictionId: 'eu',
    cities: [
      { name: 'Antwerp', lat: 51.2194, lon: 4.4025 },
      { name: 'Bruges (Zeebrugge)', lat: 51.3267, lon: 3.1992 },
      { name: 'Ghent', lat: 51.0543, lon: 3.7174 },
      { name: 'Ostend', lat: 51.2292, lon: 2.9158 },
    ],
  },
  {
    id: 'cn', name: 'China', lat: 35.8617, lon: 104.1954, jurisdictionId: null,
    cities: [
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
      { name: 'Shenzhen (Yantian)', lat: 22.5596, lon: 114.1336 },
      { name: 'Tianjin', lat: 39.3434, lon: 117.3616 },
      { name: 'Qingdao', lat: 36.0671, lon: 120.3826 },
      { name: 'Ningbo', lat: 29.8683, lon: 121.5440 },
      { name: 'Guangzhou (Nansha)', lat: 22.7238, lon: 113.5696 },
      { name: 'Xiamen', lat: 24.4798, lon: 118.0894 },
      { name: 'Dalian', lat: 38.9140, lon: 121.6147 },
    ],
  },
  {
    id: 'vn', name: 'Vietnam', lat: 14.0583, lon: 108.2772, jurisdictionId: null,
    cities: [
      { name: 'Ho Chi Minh City', lat: 10.7769, lon: 106.7009 },
      { name: 'Hai Phong', lat: 20.8449, lon: 106.6881 },
      { name: 'Da Nang', lat: 16.0544, lon: 108.2022 },
      { name: 'Vung Tau', lat: 10.3460, lon: 107.0843 },
      { name: 'Quy Nhon', lat: 13.7765, lon: 109.2237 },
    ],
  },
  {
    id: 'my', name: 'Malaysia', lat: 4.2105, lon: 101.9758, jurisdictionId: null,
    cities: [
      { name: 'Port Klang', lat: 3.0053, lon: 101.3909 },
      { name: 'Johor Bahru (Tanjung Pelepas)', lat: 1.3621, lon: 103.5615 },
      { name: 'Penang', lat: 5.4141, lon: 100.3288 },
      { name: 'Kuantan', lat: 3.8077, lon: 103.3260 },
      { name: 'Kota Kinabalu', lat: 5.9804, lon: 116.0735 },
      { name: 'Kuching', lat: 1.5533, lon: 110.3592 },
    ],
  },
  {
    id: 'ke', name: 'Kenya', lat: -0.0236, lon: 37.9062, jurisdictionId: null,
    cities: [
      { name: 'Mombasa', lat: -4.0435, lon: 39.6682 },
      { name: 'Lamu', lat: -2.2686, lon: 40.9020 },
      { name: 'Malindi', lat: -3.2138, lon: 40.1169 },
      { name: 'Kilifi', lat: -3.6305, lon: 39.8499 },
    ],
  },
  {
    id: 'tz', name: 'Tanzania', lat: -6.3690, lon: 34.8888, jurisdictionId: null,
    cities: [
      { name: 'Dar es Salaam', lat: -6.7924, lon: 39.2083 },
      { name: 'Zanzibar City', lat: -6.1630, lon: 39.1989 },
      { name: 'Tanga', lat: -5.0689, lon: 39.0989 },
      { name: 'Mtwara', lat: -10.2740, lon: 40.1877 },
    ],
  },
  {
    id: 'mz', name: 'Mozambique', lat: -18.6657, lon: 35.5296, jurisdictionId: null,
    cities: [
      { name: 'Maputo', lat: -25.9692, lon: 32.5732 },
      { name: 'Beira', lat: -19.8437, lon: 34.8389 },
      { name: 'Nacala', lat: -14.5477, lon: 40.6773 },
      { name: 'Pemba', lat: -12.9736, lon: 40.5177 },
    ],
  },
  {
    id: 'mg', name: 'Madagascar', lat: -18.7669, lon: 46.8691, jurisdictionId: null,
    cities: [
      { name: 'Toamasina', lat: -18.1492, lon: 49.4027 },
      { name: 'Antsiranana (Diego Suarez)', lat: -12.2773, lon: 49.2913 },
      { name: 'Mahajanga', lat: -15.7165, lon: 46.3173 },
      { name: 'Toliara', lat: -23.3567, lon: 43.6833 },
    ],
  },
  {
    id: 'mu', name: 'Mauritius', lat: -20.3484, lon: 57.5522, jurisdictionId: null,
    cities: [
      { name: 'Port Louis', lat: -20.1609, lon: 57.4989 },
      { name: 'Grand Baie', lat: -20.0116, lon: 57.5823 },
      { name: 'Mahébourg', lat: -20.4086, lon: 57.7024 },
    ],
  },
  {
    id: 'mv', name: 'Maldives', lat: 3.2028, lon: 73.2207, jurisdictionId: null,
    cities: [
      { name: 'Malé', lat: 4.1755, lon: 73.5093 },
      { name: 'Addu Atoll (Gan)', lat: -0.6933, lon: 73.1554 },
      { name: 'Laamu Atoll', lat: 1.9424, lon: 73.4705 },
    ],
  },
  {
    id: 'fj', name: 'Fiji', lat: -16.5782, lon: 179.4144, jurisdictionId: null,
    cities: [
      { name: 'Suva', lat: -18.1248, lon: 178.4501 },
      { name: 'Lautoka', lat: -17.6150, lon: 177.4516 },
      { name: 'Labasa', lat: -16.4333, lon: 179.3667 },
      { name: 'Nadi', lat: -17.7765, lon: 177.4356 },
    ],
  },
  {
    id: 'bs', name: 'Bahamas', lat: 25.0343, lon: -77.3963, jurisdictionId: null,
    cities: [
      { name: 'Nassau', lat: 25.0480, lon: -77.3554 },
      { name: 'Freeport', lat: 26.5285, lon: -78.6966 },
      { name: 'George Town (Exuma)', lat: 23.5133, lon: -75.7742 },
    ],
  },
  {
    id: 'jm', name: 'Jamaica', lat: 18.1096, lon: -77.2975, jurisdictionId: null,
    cities: [
      { name: 'Kingston', lat: 17.9971, lon: -76.7936 },
      { name: 'Montego Bay', lat: 18.4762, lon: -77.8939 },
      { name: 'Ocho Rios', lat: 18.4031, lon: -77.1003 },
      { name: 'Portland (Port Antonio)', lat: 18.1794, lon: -76.4529 },
    ],
  },
  {
    id: 'cu', name: 'Cuba', lat: 21.5218, lon: -77.7812, jurisdictionId: null,
    cities: [
      { name: 'Havana', lat: 23.1136, lon: -82.3666 },
      { name: 'Santiago de Cuba', lat: 20.0247, lon: -75.8219 },
      { name: 'Cienfuegos', lat: 22.1464, lon: -80.4407 },
      { name: 'Mariel', lat: 22.9940, lon: -82.7545 },
    ],
  },
  {
    id: 'do', name: 'Dominican Republic', lat: 18.7357, lon: -70.1627, jurisdictionId: null,
    cities: [
      { name: 'Santo Domingo', lat: 18.4861, lon: -69.9312 },
      { name: 'Puerto Plata', lat: 19.7936, lon: -70.6877 },
      { name: 'La Romana', lat: 18.4273, lon: -68.9720 },
    ],
  },
  {
    id: 'pr', name: 'Puerto Rico', lat: 18.2208, lon: -66.5901, jurisdictionId: 'us_federal',
    cities: [
      { name: 'San Juan', lat: 18.4655, lon: -66.1057 },
      { name: 'Ponce', lat: 18.0111, lon: -66.6141 },
      { name: 'Mayagüez', lat: 18.2013, lon: -67.1397 },
    ],
  },
  {
    id: 'tt', name: 'Trinidad and Tobago', lat: 10.6918, lon: -61.2225, jurisdictionId: null,
    cities: [
      { name: 'Port of Spain', lat: 10.6549, lon: -61.5019 },
      { name: 'Point Lisas', lat: 10.4033, lon: -61.4892 },
      { name: 'Scarborough (Tobago)', lat: 11.1790, lon: -60.7330 },
    ],
  },
  {
    id: 'bb', name: 'Barbados', lat: 13.1939, lon: -59.5432, jurisdictionId: null,
    cities: [
      { name: 'Bridgetown', lat: 13.0969, lon: -59.6145 },
      { name: 'Speightstown', lat: 13.2498, lon: -59.6441 },
    ],
  },
];

// Map from country name to COUNTRIES entry for fast lookup
export const COUNTRIES_BY_NAME = Object.fromEntries(COUNTRIES.map(c => [c.name, c]));
export const COUNTRIES_BY_ID = Object.fromEntries(COUNTRIES.map(c => [c.id, c]));
