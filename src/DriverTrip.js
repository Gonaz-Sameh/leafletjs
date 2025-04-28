<<<<<<< HEAD
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_BASEURL);

const DriverTrip = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [tripStarted, setTripStarted] = useState(false);
  const [tripId, setTripId] = useState(null);
  const [coordinates, setCoordinates] = useState([]);

  const watchIdRef = useRef(null);
  const saveCounterRef = useRef(0);

  const backend_baseurl = process.env.REACT_APP_BACKEND_BASEURL;
  const busId = "68069b59272293206bf1a445";

  const localStorageKey = tripId
    ? `trip-${busId}-${selectedRoute}-${tripId}`
    : null;

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    fetch(`${backend_baseurl}/api/v1/routes`)
      .then((res) => res.json())
      .then(setRoutes)
      .catch(console.error);
  }, []);

  const startTrip = async () => {
    if (!selectedRoute) return alert("Please select a route.");
    try {
      const res = await fetch(`${backend_baseurl}/api/v1/trips/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId, routeId: selectedRoute }),
      });
      const data = await res.json();
      setTripId(data.tripId);
      setTripStarted(true);
      setCoordinates([]);
      saveCounterRef.current = 0;
    } catch (error) {
      console.error("Failed to start trip:", error);
    }
  };

  const endTrip = async () => {
    if (!tripId) return;

    const finalCoordinates = [...coordinates];

    try {
      await fetch(`${backend_baseurl}/api/v1/trips/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, coordinates: finalCoordinates }),
      });

      setTripStarted(false);
      setTripId(null);
      setCoordinates([]);
      saveCounterRef.current = 0;

      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }

      alert("Trip ended and data saved.");
    } catch (e) {
      alert("Error ending trip");
      console.error(e);
    }
  };

  useEffect(() => {
    if (tripStarted && tripId) {
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const timestamp = new Date().toISOString();
            const point = { lat: latitude, lng: longitude, timestamp };

            setCoordinates((prev) => {
              const updated = [...prev];
              const lastPoint = updated[updated.length - 1];

              // Redundancy check
              if (lastPoint) {
                const isSameLocation =
                  lastPoint.lat.toFixed(5) === point.lat.toFixed(5) &&
                  lastPoint.lng.toFixed(5) === point.lng.toFixed(5);
                if (isSameLocation) {
                  console.log("Ignored redundant location");
                  return updated; // Skip redundant point
                }

                // Out of range check (>300m sudden jump)
                const distance = haversineDistance(
                  lastPoint.lat,
                  lastPoint.lng,
                  point.lat,
                  point.lng
                );
                if (distance > 300) {
                  console.warn("Ignored jumpy location, distance:", distance);
                  return updated; // Skip GPS glitch
                }
              }

              updated.push(point);

              // Save every 5 points
              saveCounterRef.current += 1;
              if (saveCounterRef.current >= 5) {
                if (localStorageKey) {
                  localStorage.setItem(localStorageKey, JSON.stringify(updated));
                  console.log("Saved to localStorage", updated.length, "points");
                }
                saveCounterRef.current = 0;
              }

              // Emit only after validation
              socket.emit("locationUpdate", {
                tripId,
                routeId: selectedRoute,
                busId,
                lat: latitude,
                lng: longitude,
              });

              return updated;
            });
          },
          (error) => {
            console.error("Location error:", error);
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }

      return () => {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    }
  }, [tripStarted, tripId]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚍 Driver Trip</h2>

      <select
        onChange={(e) => setSelectedRoute(e.target.value)}
        value={selectedRoute}
      >
        <option value="" disabled>
          Select a route
        </option>
        {routes.map((route) => (
          <option key={route._id} value={route._id}>
            {route.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: "10px" }}>
        {!tripStarted ? (
          <button onClick={startTrip}>Start Trip v2</button>
        ) : (
          <button onClick={endTrip}>End Trip</button>
        )}
      </div>
    </div>
  );
};

export default DriverTrip;
=======
import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_BASEURL);

const DriverTrip = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [tripStarted, setTripStarted] = useState(false);
  const [tripId, setTripId] = useState(null);


  const [intervalId, setIntervalId] = useState(null);

  const backend_baseurl =process.env.REACT_APP_BACKEND_BASEURL;
  const busId = "68069b59272293206bf1a445"; // Replace with dynamic logic later

  useEffect(() => {
    fetch(`${backend_baseurl}/api/v1/routes`)
      .then((res) => res.json())
      .then(setRoutes)
      .catch(console.error);
  }, []);

  const startTrip = async () => {
    if (!selectedRoute) return alert("Please select a route.");

    const res = await fetch(`${backend_baseurl}/api/v1/trips/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busId, routeId: selectedRoute }),
    });
    const data = await res.json();
    setTripId(data.tripId);
    setTripStarted(true);
    //emitLocation(); // Initial location emit
  };

  const endTrip = async () => {
    if (!tripId) return;
    const key = `${busId}-${selectedRoute}-${tripId}`;
    console.log(`${busId}-${selectedRoute}-${tripId}`);



    const coordinates = JSON.parse(localStorage.getItem(key)) || [];
    try {
      await fetch(`${backend_baseurl}/api/v1/trips/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, coordinates }),
      });
      // Clear the interval to stop further emissions
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null); // Reset the interval ID
      }


      setTripStarted(false);
      setTripId(null);
      alert("Trip ended");
      console.log("Trip ended");
      localStorage.removeItem(key); // 🧹 Clean up
    } catch (e) {
      alert("error while ending trip ")
      console.log("Trip ended");
    }
  };

  //test bus move 
  /*let fakeLat = 30.0548745;
  let fakeLng = 31.3441448;

  const emitLocation = () => {
    fakeLat += 0.0009;
    fakeLng += 0.0009;

    try {

      const point = { lat: fakeLat, lng: fakeLng, timestamp: new Date().toISOString() };
      const key = `${busId}-${selectedRoute}-${tripId}`;

      // 🧠 Store point in localStorage
      const existing = JSON.parse(localStorage.getItem(key)) || [];
      existing.push(point);
      localStorage.setItem(key, JSON.stringify(existing));




      socket.emit("locationUpdate", {
        tripId: tripId,
        routeId: selectedRoute,
        busId,
        lat: fakeLat,
        lng: fakeLng,
      });
    }
    catch (e) {
      console.log("failed to emit locationUpdate event ");

    }
  };*/
  const emitLocation = () => {
       try {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
  
      const point = { lat: coords.latitude, lng: coords.longitude, timestamp: new Date().toISOString() };
      const key = `${busId}-${selectedRoute}-${tripId}`;

      // 🧠 Store point in localStorage
      const existing = JSON.parse(localStorage.getItem(key)) || [];
      existing.push(point);
      localStorage.setItem(key, JSON.stringify(existing));
      
      socket.emit("locationUpdate", {
        tripId:tripId,
       routeId:selectedRoute,
        busId,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    });
  }
     catch (e) {
      console.log("failed to emit locationUpdate event ");

    }
  };

  useEffect(() => {
    if (tripStarted && tripId) {
      const interval = setInterval(() => {
        emitLocation();
        console.log(tripId);

      }, 3000);
      setIntervalId(interval);
console.log(interval);

      // Cleanup function to clear the interval if the component unmounts
      return () => {
        if (interval) {
          clearInterval(interval);
          console.log("Cleared interval on component unmount");
        }
      };
    }
  }, [tripStarted, tripId]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚍 Driver Trip</h2>

      <select
        onChange={(e) => setSelectedRoute(e.target.value)}
        value={selectedRoute}
      >
        <option value="" disabled>
          Select a route
        </option>
        {routes.map((route) => (
          <option key={route._id} value={route._id}>
            {route.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: "10px" }}>
        {!tripStarted ? (
          <button onClick={startTrip}>Start Trip</button>
        ) : (
          <button onClick={endTrip}>End Trip</button>
        )}
      </div>
    </div>
  );
};

export default DriverTrip;
>>>>>>> fb20c10c12d18d7a2cea7c786f9d5c8aae96f906
