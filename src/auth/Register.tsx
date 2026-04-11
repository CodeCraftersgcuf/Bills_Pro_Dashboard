import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Email is required"),
      password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm your password"),
    }),
    onSubmit: () => {
      navigate("/login");
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
          <h1 className="text-3xl font-semibold text-white text-center mb-2">Register</h1>
          <p className="text-center text-gray-400 mb-8 text-sm">Create a new account</p>

          <form onSubmit={formik.handleSubmit} className="w-full">
            <div className="mb-5">
              <label htmlFor="register-email" className="block text-white mb-2 text-sm">
                Email
              </label>
              <input
                id="register-email"
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

            <div className="mb-5">
              <label htmlFor="register-password" className="block text-white mb-2 text-sm">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
                style={{ backgroundColor: "#1a2332" }}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-red-400 mt-1">{formik.errors.password}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="register-confirm" className="block text-white mb-2 text-sm">
                Confirm password
              </label>
              <input
                id="register-confirm"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full text-white placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
                style={{ backgroundColor: "#1a2332" }}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="text-sm text-red-400 mt-1">{formik.errors.confirmPassword}</p>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-gray-400 mt-2 hover:text-white"
              >
                {showPassword ? "Hide passwords" : "Show passwords"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-medium text-gray-900 transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(90deg, #FFFFFF 0%, #1DB61D 100%)",
              }}
            >
              Create account
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-lime-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
