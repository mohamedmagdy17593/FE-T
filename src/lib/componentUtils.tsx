import { FaLightbulb, FaWind, FaFire } from "react-icons/fa";
import { TbAirConditioning } from "react-icons/tb";
import type { ComponentType } from "@/store/gridStore";

export const getIconForComponentType = (type: ComponentType) => {
  switch (type) {
    case "light":
      return <FaLightbulb />;
    case "air_supply":
      return <TbAirConditioning />;
    case "air_return":
      return <FaWind />;
    case "smoke_detector":
      return <FaFire />;
    default:
      return null;
  }
};
