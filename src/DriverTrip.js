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
  let fakeLat = 30.0548745;
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
  };
  /*const emitLocation = () => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      console.log({
       routeId:selectedRoute,
        busId,
        lat: coords.latitude,
        lng: coords.longitude,
      });
      
      socket.emit("locationUpdate", {
        tripId:tripId,
       routeId:selectedRoute,
        busId,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    });
  };*/

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
