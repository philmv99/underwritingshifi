#!/bin/bash

# Build script for packaging the Underwriting Score Calculator application

# Create a build directory
mkdir -p build

# Copy server files
cp -r server build/
rm -rf build/server/uploads/*
rm -f build/server/underwriting.db

# Build the client
cd client
npm run build
cd ..

# Copy client build to server public directory
mkdir -p build/server/public
cp -r client/build/* build/server/public/

# Copy documentation
cp README.md build/
cp API_DOCUMENTATION.md build/

# Copy package.json
cp package.json build/

# Create a zip file
cd build
zip -r underwriting-score-calculator.zip *
cd ..
mv build/underwriting-score-calculator.zip ./

echo "Build completed. The application has been packaged as underwriting-score-calculator.zip"
