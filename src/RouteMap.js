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



const socket = io(process.env.REACT_APP_BACKEND_BASEURL);
const startIcon = new L.DivIcon({
  html: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#F3CA14" stroke="green" stroke-width="1"/>
      <text x="12" y="17" font-size="13" text-anchor="middle" fill="black">S</text>
    </svg>
  `,
  className: "",
  iconSize: [25, 25],
  iconAnchor: [12, 12]
});

const endIcon = new L.DivIcon({
  html: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#F3CA14" stroke="red" stroke-width="1"/>
      <text x="12" y="17" font-size="13" text-anchor="middle" fill="black">E</text>
    </svg>
  `,
  className: "",
  iconSize: [25, 25],
  iconAnchor: [12, 12]
});

const busLiveIcon = new L.DivIcon({
  html: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="green" stroke="#FFF" stroke-width="3"/>
      <text x="12" y="16" font-size="14" text-anchor="middle" fill="white">B</text>
    </svg>
  `,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});



// Custom SVG-based icons for better control
const stationsIcon = new L.DivIcon({
  html: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="black" stroke="#FFF" stroke-width="2"/>
      <text x="12" y="16" font-size="12" text-anchor="middle" fill="white">S</text>
    </svg>
  `,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const busOfflineIcon = new L.DivIcon({
  html: `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#9C27B0" d="M18 11H6V6h12m-1.5 11a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5m-9 0A1.5 1.5 0 0 1 6 14.5 1.5 1.5 0 0 1 7.5 13a1.5 1.5 0 0 1 1.5 1.5A1.5 1.5 0 0 1 7.5 16M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10z"/>
    </svg>
  `,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const RouteMap = () => {
  // Color scheme for better visualization
  const colors = {
    plannedRoute: '#3388ff',  // Blue for planned routes
    activeTrip: '#ff7800',    // Orange for active trips
    completedTrip: '#555',    // Dark gray for completed trips
    liveBus: '#e53e3e',       // Red for live bus
    offlineBus: '#718096',    // Gray for offline bus
    station: '#38a169'        // Green for stations
  };
  const [selectedTile, setSelectedTile] = useState('osm'); // Default to OpenStreetMap

  const tileLayers = {
    osm: {
      name: 'OpenStreetMap',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    esri: {
      name: 'Esri World Imagery',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
  };
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


    const [trafficInfo, setTrafficInfo] = useState(null);
    const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
    const [error, setError] = useState(null);


  // Reset `shouldFitBounds` after fitting is complete
  const handleFitBoundsComplete = () => {
    setShouldFitBounds(false);
  };
  const backend_baseurl = process.env.REACT_APP_BACKEND_BASEURL;

  // 🔴 ADD - Setup socket connection
  useEffect(() => {

    //alert("dd")
    socket.on("busLocationUpdate", ({ tripId, routeId, busId, lat, lng }) => {
      if (routeId === selectedRouteId && tripId == selectedTripId) {

        // ✅ Only update marker position
        setBusPath([[lat, lng]]);
      }
    });

    return () => socket.disconnect();
  }, [selectedRouteId, selectedTripId]);

  //get routes to select route from dropdown ,
  useEffect(() => {
    fetch(`${backend_baseurl}/api/v1/routes`, {
      method: 'GET',
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
        if (latestLiveCoordinates && latestLiveCoordinates.lat && latestLiveCoordinates.lng) {
          setTripLatestLiveCoordinates([[latestLiveCoordinates.lat, latestLiveCoordinates.lng]])
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

  const estimateTravelTime = async () => {
    if (!selectedRouteId || route.length < 2) return;
  
    setIsLoadingTraffic(true);
    setError(null);
  
    try {
      console.log(route);
      
      // 1. Get base route from OpenRouteService
      const orsResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': '5b3ce3597851110001cf62480f88fa10836b4c6990030f5767fb9d71'
        },
        body: JSON.stringify({
          coordinates: route.map(c => [c[1], c[0]]), // Convert to [lng, lat]
          instructions: false
        })
      });
      
      const orsData = await orsResponse.json();
      const baseDuration = orsData.routes[0].summary.duration; // in seconds
  
      // 2. Get traffic data from TomTom
      const tomTomResponse = await fetch(
        `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
        `?key=H1acEMeFQr8cJsAOgL0nT1drv7lyA2Fe` +
        `&point=${route[0][0]},${route[0][1]}` + // Start point
        `&unit=KMPH`
      );
      
      const tomTomData = await tomTomResponse.json();
      const currentSpeed = tomTomData.flowSegmentData.currentSpeed;
      const freeFlowSpeed = tomTomData.flowSegmentData.freeFlowSpeed;
  
      // 3. Calculate adjusted time
      const congestionFactor = freeFlowSpeed / currentSpeed;
      const adjustedDuration = baseDuration * congestionFactor;
  
      setTrafficInfo({
        baseTime: Math.round(baseDuration / 60), // in minutes
        adjustedTime: Math.round(adjustedDuration / 60), // in minutes
        currentSpeed: Math.round(currentSpeed),
        freeFlowSpeed: Math.round(freeFlowSpeed),
        congestion: Math.round((1 - (currentSpeed / freeFlowSpeed)) * 100) // %
      });
  
    } catch (err) {
      setError("Failed to get traffic data. Using base estimation only.");
      console.error(err);
    } finally {
      setIsLoadingTraffic(false);
    }
  };

  return (
    <>
      {/* Tile Layer Selector Dropdown */}
      <div style={{ padding: '10px', zIndex: 1000, position: 'relative' }}>
        <label htmlFor="tile-select">Map Style: </label>
        <select
          id="tile-select"
          value={selectedTile}
          onChange={(e) => setSelectedTile(e.target.value)}
          style={{ padding: '5px', borderRadius: '4px' }}
        >
          <option value="osm">OpenStreetMap (Default)</option>
          <option value="esri">Esri Satellite Imagery</option>
        </select>
      </div>
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
        {!disabledDuringDrow && <>

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
              <label>Select Trip: </label>
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
          </button>   
          
          {!disabledDuringDrow && selectedRouteId && (
  <button 
    onClick={estimateTravelTime}
    disabled={isLoadingTraffic}
    style={{marginLeft: '10px'}}
  >
    {isLoadingTraffic ? 'Calculating...' : '🚦 Get Traffic Estimate'}
  </button>
)}
{trafficInfo && (
  <div style={{
    padding: '10px',
    margin: '10px 0',
    background: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #ddd'
  }}>
    <h4>Traffic Information</h4>
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      <div>
        <strong>Base Time:</strong> {trafficInfo.baseTime} mins
        <br />
        <strong>With Traffic:</strong> {trafficInfo.adjustedTime} mins
      </div>
      <div>
        <strong>Current Speed:</strong> {trafficInfo.currentSpeed} km/h
        <br />
        <strong>Free Flow Speed:</strong> {trafficInfo.freeFlowSpeed} km/h
      </div>
      <div>
        <strong>Congestion:</strong> {trafficInfo.congestion}%
        <br />
        <strong>Delay:</strong> +{trafficInfo.adjustedTime - trafficInfo.baseTime} mins
      </div>
    </div>
    
    {trafficInfo.incidents?.length > 0 && (
      <div style={{marginTop: '10px'}}>
        <strong>Incidents:</strong>
        <ul style={{paddingLeft: '20px'}}>
          {trafficInfo.incidents.map((incident, i) => (
            <li key={i}>
              {incident.type} (until {new Date(incident.endTime).toLocaleTimeString()})
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}

{error && (
  <div style={{color: 'red', padding: '10px'}}>
    {error}
  </div>
)}          
          
          </>}
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
          attribution={tileLayers[selectedTile].attribution}
          url={tileLayers[selectedTile].url}
        />

        <MapClickHandler />
        <FitBoundsToRoute
          route={route}
          isDrawing={isDrawing}
          selectedRouteId={selectedRouteId}
          shouldFitBounds={shouldFitBounds}
          onFitBoundsComplete={handleFitBoundsComplete}
        />

        {/* Live Bus Marker */}
        {busPath.length > 0 && (
          <Marker position={busPath[0]} icon={busLiveIcon}>
            <Popup>Live Bus Location</Popup>
          </Marker>
        )}

        {/* Offline Bus Marker */}
        {tripLatestLiveCoordinates.length > 0 && (
          <Marker position={tripLatestLiveCoordinates[0]} icon={busOfflineIcon}>
            <Popup>Last Known Location</Popup>
          </Marker>
        )}

        {/* Trip Path */}
        {tripPath.length > 1 && (
          <Polyline
            positions={tripPath}
            color={colors.activeTrip}
            weight={5}
            opacity={0.8}
            dashArray={selectedTripId ? undefined : "5, 5"} // Dashed for completed trips
          />
        )}

        {/* Trip Start/End Markers */}
        {tripPath.length > 0 && (
          <>
            <Marker position={tripPath[0]} icon={startIcon}>
              <Popup>Trip Start Point</Popup>
            </Marker>
            <Marker position={tripPath[tripPath.length - 1]} icon={endIcon}>
              <Popup>Trip End Point</Popup>
            </Marker>
          </>
        )}

        {/* Planned Route */}
        {route.length > 1 && (
        <Polyline
        positions={route}
        color={trafficInfo ? 
          (trafficInfo.congestion < 30 ? '#4CAF50' : 
           trafficInfo.congestion < 70 ? '#FFC107' : '#F44336') : 
          colors.plannedRoute}
        weight={6}
        opacity={0.8}
      />
        )}

        {/* Route Start/End Markers */}
        {route.length > 0 && (
          <>
            <Marker position={route[0]} icon={startIcon}>
              <Popup>Route Start Point</Popup>
            </Marker>
            <Marker position={route[route.length - 1]} icon={endIcon}>
              <Popup>Route End Point</Popup>
            </Marker>
          </>
        )}

 {/* Incident Markers */}
 {trafficInfo?.incidents?.map((incident, i) => (
          <Marker 
            key={`incident-${i}`} 
            position={incident.coordinates}
            icon={new L.DivIcon({
              html: `<div style="
                background: #ff4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-weight: bold;
              ">!</div>`,
              className: '',
              iconSize: [20, 20]
            })}
          >
            <Popup>
              <strong>{incident.type}</strong><br />
              {new Date(incident.startTime).toLocaleString()} - {new Date(incident.endTime).toLocaleString()}
            </Popup>
          </Marker>
        ))}
        {/* Stations */}
        {stations.map((station, idx) => (
          <Marker key={idx} position={[station.lat, station.lng]} icon={stationsIcon}>
            <Popup>
              <strong>{station.name}</strong><br />
              Station #{idx + 1}
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </>
  );
};

export default RouteMap;