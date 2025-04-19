import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom bus icon
const customBusIcon = new L.Icon({
  iconUrl: "/custom-marker.png",
  iconSize: [25, 35],
  iconAnchor: [12, 35],
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng]);
    }
  }, [lat, lng, map]);
  return null;
};

const BusTracker = () => {
  const [path, setPath] = useState([]);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;

          // Only add accurate points
          if (accuracy <= 15) {
            setPath((prev) => [...prev, [latitude, longitude]]);
            setCurrentAccuracy(accuracy);
          } else {
            console.warn("Skipped inaccurate point (accuracy:", accuracy, ")");
          }
        },
        (err) => {
          console.error("Error getting location:", err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    updateLocation(); // initial
    intervalRef.current = setInterval(updateLocation, 5000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const currentPosition = path[path.length - 1];

  return (
    <div>
      <h2 style={{ padding: "10px" }}>🛰️ Live Bus Tracker</h2>
      <MapContainer
        center={currentPosition || [30.0444, 31.2357]}
        zoom={16}
        style={{ height: "85vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentPosition && (
          <>
            <RecenterMap lat={currentPosition[0]} lng={currentPosition[1]} />
            <Marker position={currentPosition} icon={customBusIcon} />
            {currentAccuracy && (
              <Circle
                center={currentPosition}
                radius={currentAccuracy}
                pathOptions={{ color: "blue", fillOpacity: 0.1 }}
              />
            )}
            {path.length > 1 && (
              <Polyline positions={path} color="red" weight={4} />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default BusTracker;
