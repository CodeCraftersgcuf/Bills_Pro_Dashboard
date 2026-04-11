import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";
import loginHero from "../assets/login_image.png";

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

  const inputClass =
    "w-full rounded-xl bg-[#DCDCDE] text-gray-900 placeholder:text-gray-500 py-3.5 px-4 pr-11 text-[15px] border-0 focus:outline-none focus:ring-2 focus:ring-[#22A35C]/40";

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-contain lg:flex-row lg:overflow-hidden">
      {/* Hero — abstract background (left on desktop, top strip on mobile) */}
      <div
        className="h-44 shrink-0 bg-cover bg-center sm:h-52 lg:h-full lg:min-h-0 lg:w-1/2 lg:self-stretch"
        style={{ backgroundImage: `url(${loginHero})` }}
        aria-hidden
      />

      {/* Form panel */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-10 sm:px-8 lg:px-12 lg:overflow-y-auto bg-[#F0F0F2]">
        <div
          className="w-full max-w-[420px] rounded-[20px] px-8 py-10 sm:px-10 sm:py-12"
          style={{
            backgroundColor: "#E4E4E6",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-black text-center tracking-tight">
            Login
          </h1>
          <p className="text-center text-gray-500 text-sm sm:text-[15px] mt-2 mb-8 font-normal">
            Login to the admin dashboard
          </p>

          <form onSubmit={formik.handleSubmit} className="w-full space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-black font-medium text-sm mb-2">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                placeholder="Enter email address"
                autoComplete="email"
                className={`${inputClass} pr-4`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-red-600 mt-1.5">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-black font-medium text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/70 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22A35C]/50 rounded-md"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={2} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={2} />
                  )}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-red-600 mt-1.5">{formik.errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full font-bold text-white text-[15px] mt-2 transition-opacity hover:opacity-95 active:opacity-90 bg-[#22A35C] shadow-sm"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
