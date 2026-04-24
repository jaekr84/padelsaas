import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function applyMigration() {
  console.log("Applying exclusion constraint migration...");
  try {
    const migrationPath = path.join(process.cwd(), 'drizzle', '0001_add_exclusion_constraint.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute parts (btree_gist and constraint)
    const commands = migrationSql.split(';').map(c => c.trim()).filter(c => c.length > 0);
    
    for (const cmd of commands) {
        console.log(`Executing: ${cmd.substring(0, 50)}...`);
        await sql.query(cmd);
    }
    
    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
