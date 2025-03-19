## Running the application

To test the app with Constant Contact, a dummy user with a Constant Contact token is required as the app doesn't have an auth flow implemented.

Get a constant contact token and add it to the test user in the setup-db.js file, or add the user directly to "users" collection directly to the database.
You are also going to need a list id to sync your contacts to.

```
{
  "_id": {
    "$oid": "67cf575d562cd26f0c2ffe49"
  },
  "email": "john.doe@example.com",
  "name": "John Doe",
  "last_synced_at": {
    "$date": "2025-03-19T14:14:07.468Z"
  },
  "constant_contact_lists_ids": [
    "xxxxx" # list in in constanct contact
  ],
  "constant_contact_token": "xxxx", # constanct contact token
  "constant_contact_refresh_token": "xxxx", # constanct contact refresh token
  "createdAt": {
    "$date": "2025-03-19T14:14:07.468Z"
  },
  "updatedAt": {
    "$date": "2025-03-19T14:14:07.468Z"
  }
}
```



Build the app and run it - This builds the app container and the mongodb container
```bash
docker-compuse up --build
```
Setup the database
```bash
npm run setup-db
```
