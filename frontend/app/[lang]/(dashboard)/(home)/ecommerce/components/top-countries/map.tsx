"use client"

import world from "./worldmap.json";
import { VectorMap } from "@south-paw/react-vector-maps";

const Map = ({ height = 300 }) => {

  return (
    <div className={`w-full h-[${height}px]`}>
      <VectorMap {...world} className="h-full w-full object-cover copilotsmc-codeVmapPrimary" />
    </div>
  );
};

export default Map;
