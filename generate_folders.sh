#!/bin/bash

# Define the pages based on the icon names
pages=(
  "booking"
  "dashboard"
  "earning"
  "notification"
  "rating"
  "riderManagement"
  "setting"
  "statement"
  "support"
  "tracking"
  "userManagement"
)

# Navigate to the pages directory
cd src/pages || exit

# Loop through each page name to create folders and files
for page in "${pages[@]}"; do
  mkdir -p "$page/components"  # Create the page folder and its components folder

  # Create the main page file
  cat <<EOL > "$page/$(echo "$page" | awk '{print toupper(substr($0,1,1)) substr($0,2)}').tsx"
import React from "react";

const $(echo "$page" | awk '{print toupper(substr($0,1,1)) substr($0,2)}') = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome to the $(echo "$page" | awk '{print toupper(substr($0,1,1)) substr($0,2)}') Page</h1>
    </div>
  );
};

export default $(echo "$page" | awk '{print toupper(substr($0,1,1)) substr($0,2)}');
EOL

done

echo "Folder structure and component files created successfully!"
