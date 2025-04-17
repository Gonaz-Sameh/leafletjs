import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    useMapEvents,
  } from "react-leaflet";
  import { useState, useCallback } from "react";
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  // Custom marker icon setup
  const customMarkerIcon = new L.Icon({
    iconUrl: "/custom-marker.png",
    iconSize: [30, 40],        // You can adjust this for visual balance
    iconAnchor: [15, 40],      // Keep it centered at bottom
    popupAnchor: [0, -35],     // Position popup above the icon
  });



  const RouteMap = () => {
    const [route, setRoute] = useState([]);
    const [stations, setStations] = useState([]);
    const [isDrawing, setIsDrawing] = useState(true);
  
    const handleMapClick = useCallback(
      (e) => {
        if (!isDrawing) return;
        const { lat, lng } = e.latlng;
        // Only add if last point is different
        const last = route[route.length - 1];
        if (!last || last[0] !== lat || last[1] !== lng) {
          setRoute((prev) => [...prev, [lat, lng]]);
        }
      },
      [isDrawing, route]
    );
  
    const handleRightClick = useCallback((e) => {
      const name = prompt("Enter station name:");
      if (name) {
        setStations((prev) => [
          ...prev,
          { name, lat: e.latlng.lat, lng: e.latlng.lng },
        ]);
      }
    }, []);
  
    const MapClickHandler = () => {
      useMapEvents({
        click: handleMapClick,
        contextmenu: handleRightClick,
      });
      return null;
    };
  
    const removeLastPoint = () => {
      // Remove the last route point immediately
      setRoute((prev) => {
        if (prev.length > 0) {
          const newRoute = [...prev];
          newRoute.pop();
          return newRoute;
        }
        return prev;
      });
    };
  
    const finishRoute = () => {
      if (route.length < 2) {
        alert("Draw at least two points for a route.");
        return;
      }
      setIsDrawing(false);
      alert("Route drawing finished. You can now save it.");
    };
  
    const saveRoute = async () => {
      const name = prompt("Route Name:");
      if (!name) return;
  
      try {
        const response = await fetch("/api/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            coordinates: route.map(([lat, lng]) => ({ lat, lng })),
            stations,
          }),
        });
  
        const data = await response.json();
        console.log("Saved:", data);
  
        // Reset everything to start a new route
        setRoute([]);
        setStations([]);
        setIsDrawing(true);
        alert("Route saved. You can now draw a new one.");
      } catch (err) {
        
        console.error("Error saving route:", err);
      }
    };
  
    return (
      <>
        <div style={{ padding: "10px" }}>
          <button onClick={removeLastPoint} disabled={!isDrawing || route.length === 0}>
            ⏪ Remove Last Point
          </button>{" "}
          <button onClick={finishRoute} disabled={!isDrawing || route.length < 2}>
            ✅ Finish Drawing
          </button>{" "}
          <button onClick={saveRoute} disabled={isDrawing || route.length < 2}>
            💾 Save Route
          </button>
        </div>
  
        <MapContainer
          center={[30.0444, 31.2357]}
          zoom={13}
          style={{ height: "85vh", width: "100%" }}
          scrollWheelZoom={!isDrawing ? true : false}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
  
          <MapClickHandler />
  
          {route.length > 1 && <Polyline positions={route} color="blue" />}
  
          {stations.map((station, idx) => (
            <Marker key={idx} position={[station.lat, station.lng]}  icon={customMarkerIcon}>
              <Popup>{station.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </>
    );
  };
  
  export default RouteMap;
  