import React from "react";

interface PageShellProps {
  title: string;
  description?: string;
}

const PageShell: React.FC<PageShellProps> = ({
  title,
  description = "Starter screen — replace with your feature code.",
}) => (
  <div className="text-white">
    <h1 className="text-2xl font-semibold tracking-tight mb-2">{title}</h1>
    <p className="text-gray-400 text-sm max-w-xl">{description}</p>
  </div>
);

export default PageShell;
