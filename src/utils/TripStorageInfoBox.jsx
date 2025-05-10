import React, { useEffect, useState } from "react";

const TripStorageInfoBox = ({ refreshKey }) => {
  const [currentTripCount, setCurrentTripCount] = useState(0);
  const [tripHistoryCount, setTripHistoryCount] = useState(0);

  useEffect(() => {
    let current = 0;
    let history = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key.startsWith("current_trip")) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data?.tripId !== null) {
            current++;
          }
        } catch (e) {
          console.warn(`Invalid JSON in ${key}`, e);
        }
      }

      if (key.startsWith("trip-")) {
        history++;
      }
    }

    setCurrentTripCount(current);
    setTripHistoryCount(history);
  }, [refreshKey]); // Refresh whenever the prop changes

  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "12px 16px",
      margin: "5px",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9"
    }}>
      <h4>📦 Trip Data Stored Summary</h4>
      <p><strong>Current Active Trips:</strong> {currentTripCount}</p>
      <p><strong>Trips Coordinates Saved:</strong> {tripHistoryCount}</p>
    </div>
  );
};

export default TripStorageInfoBox;
