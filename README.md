## Running the application

To test the app with Constant Contact, a dummy user with a Constant Contact token is required as the app doesn't have an auth flow implemented.

Get a constant contact token and add it to the test user in the setup-db.js file, or update the user manually directly in the database.

Build the app and run it - This builds the app container and the mongodb container
```bash
docker-compuse up --build
```
Setup the database
```bash
npm run setup-db
```
