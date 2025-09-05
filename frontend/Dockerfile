# Base layer
FROM node:20-alpine as build

# Set the working directory 
WORKDIR /app

# Copy over dependency files 
COPY package.json ./
COPY package-lock.json ./

# Install 
RUN npm install --ignore-scripts

# Copy all files 
COPY . .


FROM build as dev

COPY --from=build /app /app
CMD ["npm", "run" , "dev"]
