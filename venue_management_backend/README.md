This is the backend part of the Venue Management project built using Node.js and MongoDB Atlas. The backend provides APIs to manage venues, including adding, updating, and deleting venue information, as well as uploading images and managing unavailable dates.


Install the dependencies:


**npm install**



MongoDB Atlas:


Obtain the connection string from MongoDB Atlas.

In the project root, create a .env file and add the following:


MONGO_URI=your_mongodb_atlas_connection_string

PORT=5000


API Endpoints

POST /venues: Create a new venue.

GET /venues: Get all venues.

GET /venues/:id: Get a venue by ID.

PUT /venues/:id: Update a venue by ID.

DELETE /venues/:id: Delete a venue by ID.


Running the Application

node server.js
