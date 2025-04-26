import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import io from "socket.io-client"; // 🔴 ADD
import "leaflet/dist/leaflet.css";
import { useRef } from "react";


// Custom marker icons
const stationsIcon = new L.Icon({
  iconUrl: "/custom-marker.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -35],
});

const startIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -35],
});

const endIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -35],
});

const busLiveIcon = new L.Icon({
  // iconUrl: "/bus-icon.png", // make sure to provide this asset
  iconUrl: "./bus-icon.png",
   iconSize: [20, 20],
   iconAnchor: [15, 15],
 });
const busOfflineIcon = new L.Icon({
 // iconUrl: "/bus-icon.png", // make sure to provide this asset
 iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const RouteMap = () => {
  
  const [route, setRoute] = useState([]);
  const [stations, setStations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(true);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [isNewRoute, setIsNewRoute] = useState(true);

  const [busPath, setBusPath] = useState([]); // 🔴 ADD

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [tripPath, setTripPath] = useState([]);
  const [tripCoordinatesTimestamp, setTripCoordinatesTimestamp] = useState([]);
  
  const mapRef = useRef(null);
  const [shouldFitBounds, setShouldFitBounds] = useState(false);

  const [tripLatestLiveCoordinates, setTripLatestLiveCoordinates] = useState([]); 
  const [disabledDuringDrow, setDisabledDuringDrow] = useState(false);
  
  // Reset `shouldFitBounds` after fitting is complete
  const handleFitBoundsComplete = () => {
    setShouldFitBounds(false);
  };
  const backend_baseurl =process.env.REACT_APP_BACKEND_BASEURL;

  // 🔴 ADD - Setup socket connection
  useEffect(() => {
    const socket = io(backend_baseurl);
  //alert("dd")
    socket.on("busLocationUpdate", ({tripId,routeId,busId, lat, lng }) => {
      if (routeId === selectedRouteId && tripId == selectedTripId) {
     
  // ✅ Only update marker position
        setBusPath([[lat, lng]]);
      }
    });
  
    return () => socket.disconnect();
  }, [selectedRouteId,selectedTripId]);
  
//get routes to select route from dropdown ,
  useEffect(() => {
    fetch(`${backend_baseurl}/api/v1/routes`,{
      method: 'GET',
      headers: {
        'Host': 'localhost', // Bypass ngrok warning
      },
    })
      .then((res) => res.json())
      .then((data) => setSavedRoutes(data))
      .catch((err) => console.error("Error fetching routes", err));
  }, []);


  //get one route  selected  from dropdown , and get its trips 
  useEffect(() => {
    if (!selectedRouteId) return;
    //clear old route selected data
    setBusPath([])
    setTrips([])
    setSelectedTripId(null)
    setTripPath([]);
    setTripCoordinatesTimestamp([]);
    setTripLatestLiveCoordinates([])
    //
    // Fetch route details
    fetch(`${backend_baseurl}/api/v1/routes/${selectedRouteId}`)
      .then((res) => res.json())
      .then((data) => {
        setRoute(data.coordinates.map(({ lat, lng }) => [lat, lng]));
        setStations(data.stations);
        setIsDrawing(false);
        setIsNewRoute(false);

         // Trigger fitting to bounds
         setShouldFitBounds(true);
      })
      .catch((err) => console.error("Error loading selected route", err));
  
    // Fetch trips for that route
    fetch(`${backend_baseurl}/api/v1/trips/by-route/${selectedRouteId}`)
      .then((res) => res.json())
      .then((data) => {
  console.log(data);
  
        setTrips(data);
      
      })
      .catch((err) => console.error("Error fetching trips:", err));
  }, [selectedRouteId]);

    //get one trip  selected  from dropdown ,
  useEffect(() => {
    if (!selectedTripId) return;
  
    //clear old trip data
    setBusPath([]);
    setTripPath([]);
    setTripCoordinatesTimestamp([]);
    setTripLatestLiveCoordinates([])

    fetch(`${backend_baseurl}/api/v1/trips/${selectedTripId}`)
      .then((res) => res.json())
      .then((data) => {
        // Convert trip coordinates to Leaflet format: [[lat, lng], ...]
        const path = data.coordinates.map((point) => [point.lat, point.lng]);
        setTripPath(path);
        const timestamp = data.coordinates.map((t) => [t.timestamp]);
        setTripCoordinatesTimestamp(timestamp);
        console.log(data);
        
        let latestLiveCoordinates = data.latestLiveCoordinates;
        if(latestLiveCoordinates && latestLiveCoordinates.lat && latestLiveCoordinates.lng){
        setTripLatestLiveCoordinates([[latestLiveCoordinates.lat,latestLiveCoordinates.lng]])
      }
        //there is time of latestSyncedCoordinates
      })
      .catch((err) => console.error("Error fetching trip data:", err));
  }, [selectedTripId]);
  

  const handleMapClick = useCallback(
    (e) => {
      if (!isDrawing) return;
      const { lat, lng } = e.latlng;
      const last = route[route.length - 1];
      if (!last || last[0] !== lat || last[1] !== lng) {
        setRoute((prev) => [...prev, [lat, lng]]);
      }
    },
    [isDrawing, route]
  );

  const handleRightClick = useCallback((e) => {
    if (!isDrawing) return;
    const name = prompt("Enter station name:");
    if (name) {
      setStations((prev) => [
        ...prev,
        { name, lat: e.latlng.lat, lng: e.latlng.lng },
      ]);
    }
  }, [isDrawing]);

  const MapClickHandler = () => {
    useMapEvents({
      click: handleMapClick,
      contextmenu: handleRightClick,
    });
    return null;
  };

  /*const FitBoundsToRoute = ({ route, isDrawing }) => {
    const map = useMap();
    useEffect(() => {
      if (!isDrawing && route.length > 0) {
        const bounds = L.latLngBounds(route);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [route, isDrawing, map]);
    return null;
  };*/
  const FitBoundsToRoute = ({ route, isDrawing, selectedRouteId, shouldFitBounds, onFitBoundsComplete }) => {
    const map = useMap();
  
    useEffect(() => {
      if (shouldFitBounds && !isDrawing && route.length > 0 && selectedRouteId) {
        const bounds = L.latLngBounds(route);
        map.fitBounds(bounds, { padding: [50, 50] });
  
        // Notify parent that fitting is complete
        onFitBoundsComplete();
      }
    }, [route, isDrawing, selectedRouteId, shouldFitBounds, map, onFitBoundsComplete]);
  
    return null;
  };
  const removeLastPoint = () => {
    setRoute((prev) => prev.slice(0, -1));
  };

  const finishRoute = () => {
    if (route.length < 2) return alert("At least two points required.");
    setIsDrawing(false);
  };

  const saveRoute = async () => {
    const name = prompt("Route Name:");
    if (!name) return;
    try {
      const response = await fetch(`${backend_baseurl}/api/v1/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          coordinates: route.map(([lat, lng]) => ({ lat, lng })),
          stations,
        }),
      });

      const data = await response.json();
      alert("Route saved!");
      setSavedRoutes((prev) => [...prev, data]);

      setRoute([]);
      setStations([]);
      setIsDrawing(true);
      setIsNewRoute(true);
      setSelectedRouteId(null);
      setDisabledDuringDrow(false)
    } catch (err) {
      console.error("Error saving route:", err);
    }
  };

  const startNewRoute = () => {
    setRoute([]);
    setStations([]);
    setIsDrawing(true);
    setSelectedRouteId(null);
    setSelectedTripId(null);
    setIsNewRoute(true);
    setBusPath([]);
    setTripPath([]);
    setTripCoordinatesTimestamp([]);
    setTripLatestLiveCoordinates([])
    setDisabledDuringDrow(true)
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
        <button onClick={saveRoute} disabled={!isNewRoute || isDrawing || route.length < 2}>
          💾 Save Route
        </button>{" "}
        <button onClick={startNewRoute}>
          🆕 Start New Route
        </button>
        <br />
        { !disabledDuringDrow && <>
        <label>Select Route: </label>
        <select
          onChange={(e) => setSelectedRouteId(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Select a route</option>
          {savedRoutes.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>

        {trips.length > 0 && (
  <>
    <label>Select Completed Trip: </label>
    <select
      onChange={(e) => setSelectedTripId(e.target.value)}
      defaultValue=""
    >
      <option value="" disabled>Select a trip</option>
      {trips.map((trip) => (
        <option key={trip._id} value={trip._id}>
          {new Date(trip.startedAt).toLocaleString()} - {new Date(trip.endedAt).toLocaleString()}
        </option>
      ))}
    </select>
  </>
)}
<button
  onClick={() => setShouldFitBounds(true)}
  disabled={!selectedRouteId}
>
  📍 Fit Bounds
</button></>}
      </div>

      <MapContainer
        ref={mapRef}
        center={[30.0444, 31.2357]}
        zoom={13}
        style={{ height: "85vh", width: "100%" }}
        scrollWheelZoom={!isDrawing}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler />
        <FitBoundsToRoute
  route={route}
  isDrawing={isDrawing}
  selectedRouteId={selectedRouteId}
  shouldFitBounds={shouldFitBounds}
  onFitBoundsComplete={handleFitBoundsComplete}
/>

        {busPath.length > 0 && (
  <Marker position={busPath[0]} icon={busLiveIcon}>
    <Popup>Bus</Popup>
  </Marker>
)}
       {tripLatestLiveCoordinates.length > 0 && (
  <Marker position={tripLatestLiveCoordinates[0]} icon={busOfflineIcon}>
    <Popup>tripLatestLiveCoordinates</Popup>
  </Marker>
)}
{tripPath.length > 1 && (
  <Polyline positions={tripPath} color="red" />
)}
{tripPath.length > 0 && (
          <Marker position={tripPath[0]} icon={startIcon}>
            <Popup>Start Point</Popup>
          </Marker>
        )}
        {tripPath.length > 1 && (
          <Marker position={tripPath[tripPath.length - 1]} icon={endIcon}>
            <Popup>End Point</Popup>
          </Marker>
        )}

        {route.length > 1 && <Polyline positions={route} color="blue" />}

        {route.length > 0 && (
          <Marker position={route[0]} icon={startIcon}>
            <Popup>Start Point</Popup>
          </Marker>
        )}
        {route.length > 1 && (
          <Marker position={route[route.length - 1]} icon={endIcon}>
            <Popup>End Point</Popup>
          </Marker>
        )}

        {stations.map((station, idx) => (
          <Marker key={idx} position={[station.lat, station.lng]} icon={stationsIcon}>
            <Popup>{station.name}</Popup>
          </Marker>
        ))}

      


      </MapContainer>
    </>
  );
};

export default RouteMap;
