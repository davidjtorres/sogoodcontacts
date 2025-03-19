import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'sogoodcontacts';

// Test user data
const testUser = {
  _id:  new ObjectId('67cf575d562cd26f0c2ffe49'),
  email: 'john.doe@example.com',
  name: 'John Doe',// In a real app, this would be properly hashed
  last_synced_at: new Date(),
  constant_contact_lists_ids: ['1234567890'],
  constant_contact_token: '1234567890',
  constant_contact_refresh_token: '1234567890',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // Create or get the database
    const db = client.db(DB_NAME);
    console.log(`Using database: ${DB_NAME}`);

    // Create collections
    await db.createCollection('users');
    await db.createCollection('contacts');

    // Create indexes for users collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: 1 });

    // Create indexes for contacts collection
    await db.collection('contacts').createIndex({ userId: 1 });
    await db.collection('contacts').createIndex({ email: 1 });
    await db.collection('contacts').createIndex({ createdAt: 1 });

    console.log('Database and collections created successfully');
    console.log('Indexes created successfully');

    // Add test user
    try {
      const existingUser = await db.collection('users').findOne({ email: testUser.email });
      if (existingUser) {
        console.log(`Test user ${testUser.email} already exists, skipping creation`);
      } else {
        await db.collection('users').insertOne(testUser);
        console.log(`Test user ${testUser.email} created successfully`);
      }
    } catch (error) {
      console.error('Error creating test user:', error);
    }


  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    // Close the connection
    await client.close();
    console.log('Database connection closed');
  }
}

// Run the setup
setupDatabase().catch(console.error); 