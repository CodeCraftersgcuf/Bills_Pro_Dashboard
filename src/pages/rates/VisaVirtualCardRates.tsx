import React from "react";
import Rates from "./Rates";

/** Admin-only: platform rates for Visa virtual cards (legacy + 493). */
const VisaVirtualCardRates: React.FC = () => {
  return <Rates visaOnly />;
};

export default VisaVirtualCardRates;
