import React from "react";
import Rates from "./Rates";

/** Admin-only: platform rates for Visa virtual cards (`visa_creation`, `visa_fund`). */
const VisaVirtualCardRates: React.FC = () => {
  return <Rates visaOnly />;
};

export default VisaVirtualCardRates;
