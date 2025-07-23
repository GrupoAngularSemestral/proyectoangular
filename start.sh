#!/bin/sh
cd /app/backend
npm start&
cd ..
ng serve --host 0.0.0.0 &
wait
