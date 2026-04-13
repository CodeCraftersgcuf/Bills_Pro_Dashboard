import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAdminToken } from "../api/authToken";

const RequireAuth: React.FC = () => {
  if (!getAdminToken()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
