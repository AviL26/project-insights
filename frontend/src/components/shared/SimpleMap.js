import React, { useEffect, useRef } from 'react';

const SimpleMap = ({ projects, activeProject }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Check if Leaflet is available
    if (typeof window !== 'undefined' && window.L) {
      const map = window.L.map(mapRef.current).setView([32.0853, 34.7818], 8);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add project markers
      projects.forEach(project => {
        const color = project.status === 'Active' ? 'green' : 
                     project.status === 'Planning' ? 'orange' : 'blue';
        
        const marker = window.L.circleMarker(project.coordinates, {
          color: 'white',
          fillColor: color,
          fillOpacity: 0.8,
          radius: project.name === activeProject ? 12 : 8
        }).addTo(map);

        marker.bindPopup(`
          <strong>${project.name}</strong><br>
          Status: ${project.status}<br>
          Progress: ${project.progress}%
        `);
      });

      return () => map.remove();
    }
  }, [projects, activeProject]);

  return <div ref={mapRef} className="h-64 w-full rounded-lg" />;
};

export default SimpleMap;
