import React from "react";

const Marker = ({ type, item, flyToMarker }) => {
  const flyTo = () => {
    flyToMarker(item);
  };

  const getCount = () => {
    //console.log("type : ", type === "job" ? item : "");
    if (type === "training" && item.trainings.length > 1) return <div>{item.trainings.length}</div>;
    else if (type === "job" && item.type === "peJob") return <div>1</div>;
    else return "";
  };

  return (
    <div onClick={flyTo} className={`markerIcon ${type === "training" ? "trainingMarkerIcon" : "jobMarkerIcon"}`}>
      {getCount()}
    </div>
  );
};

export default Marker;
