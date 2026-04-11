import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Email is required"),
      password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
    }),
    onSubmit: () => {
      navigate("/dashboard");
    },
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(180deg, #020C19 0%, #00200A 100%)" }}
    >
      <div className="w-full max-w-lg">
        <div
          className="rounded-2xl px-8 py-10 w-full border border-white/10"
          style={{ backgroundColor: "#020C19" }}
        >
          <h1 className="text-3xl font-semibold text-white text-center mb-2">Login</h1>
          <p className="text-center text-gray-400 mb-8 text-sm">Sign in to continue</p>

          <form onSubmit={formik.handleSubmit} className="w-full">
            <div className="mb-5">
              <label htmlFor="login-email" className="block text-white mb-2 text-sm">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
                style={{ backgroundColor: "#1a2332" }}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-red-400 mt-1">{formik.errors.email}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="login-password" className="block text-white mb-2 text-sm">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
                style={{ backgroundColor: "#1a2332" }}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-red-400 mt-1">{formik.errors.password}</p>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-gray-400 mt-2 hover:text-white"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-medium text-gray-900 transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(90deg, #FFFFFF 0%, #1DB61D 100%)",
              }}
            >
              Sign in
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            No account?{" "}
            <Link to="/register" className="text-lime-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
