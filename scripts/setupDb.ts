import { query } from '../src/lib/db'

async function setupDatabase() {
  try {
    // Use pgcrypto's gen_random_uuid() which is available by default in PG 13+
    console.log('Setting up database...')

    // Create Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Users table created')

    // Create Events table
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMP WITH TIME ZONE NOT NULL,
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Events table created')

    // Create Event participants table
    await query(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )
    `)
    console.log('Event participants table created')

    // Create Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_text TEXT NOT NULL DEFAULT '',
        media_type VARCHAR(50),
        media_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Messages table created')

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)')
    console.log('Indexes created')

    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Error setting up database:', error)
    throw error
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
