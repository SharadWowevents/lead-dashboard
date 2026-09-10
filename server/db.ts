import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Base MongoDB URI (Do not put a specific database name at the end of this URL)
const BASE_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';

// 2. Create a base connection to the MongoDB Server
const connection = mongoose.createConnection(BASE_URI);

connection.on('connected', () => console.log(`[DB] Connected to Base MongoDB Server`));
connection.on('error', (err) => console.error('[DB] Connection error:', err));

export const isPrismaConnected = true;

// 3. Define Schemas
const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

// Flexible schema (strict: false) so if different databases have slightly different fields, it won't crash
const leadDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: false },
  mobile: { type: String, default: 'N/A' },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });


// ==========================================
// 4. MULTI-DATABASE CONFIGURATION
// ==========================================

// Setup where Admin users are stored (e.g., inside 'boscore' DB, 'admin_users' collection)
const adminDb = connection.useDb('boscore');
const AdminUser = adminDb.model('AdminUser', adminUserSchema, 'admin_users'); 

// Map your Projects to their specific Databases and Collections here:
const projects = [
  {
    siteName: 'BO Score',
    // Looks inside the 'boscore' database, inside the 'users' collection
    model: connection.useDb('boscore').model('LeadData', leadDataSchema, 'users')
  },
  {
    siteName: 'BO Score 2',
    // Looks inside a DIFFERENT database ('alpha_db'), inside the 'leads' collection
    model: connection.useDb('boscore').model('LeadData', leadDataSchema, 'users')
  },
  {
    siteName: 'Marketing Landing Page',
    // Looks inside another database ('marketing'), inside 'signups' collection
    model: connection.useDb('marketing').model('LeadData', leadDataSchema, 'signups')
  }
];


// ==========================================
// 5. DATABASE ABSTRACTION LOGIC
// ==========================================

// Helper to format Mongo docs to exactly what the React frontend expects
const formatDoc = (doc: any, siteName: string) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id.toString(), // Convert Mongo _id to string id
    siteName: siteName,
    _id: undefined,
    __v: undefined
  };
};

export const db = {
  // --- ADMIN AUTH LOGIC ---
  adminUser: {
    findUnique: async ({ where }: { where: { username?: string; id?: string } }) => {
      if (where.username) return AdminUser.findOne({ username: where.username });
      if (where.id) return AdminUser.findById(where.id);
      return null;
    },
    update: async ({ where, data }: { where: { id: string }; data: { passwordHash: string } }) => {
      return AdminUser.findByIdAndUpdate(where.id, data, { new: true });
    },
    create: async ({ data }: { data: { username: string; passwordHash: string } }) => {
      return AdminUser.create(data);
    },
  },

  // --- MULTI-TABLE LEADS LOGIC ---
  leadData: {
    // Handles creating a new lead (POST /api/ingest)
    create: async ({ data }: { data: any }) => {
      // Find which DB/Collection this project belongs to
      const targetProject = projects.find(p => p.siteName === data.siteName);
      if (!targetProject) {
        throw new Error(`Project "${data.siteName}" is not configured in the backend database mapping.`);
      }
      const newDoc = await targetProject.model.create(data);
      return formatDoc(newDoc, targetProject.siteName);
    },

    // Handles fetching leads for the dashboard
    findMany: async ({ where, orderBy }: { where?: { siteName?: string }; orderBy?: any } = {}) => {
      let allLeads: any[] = [];
      
      // Loop through every project connected in step 4
      for (const project of projects) {
        // If the frontend is filtering by a specific project, skip the others
        if (where?.siteName && where.siteName !== project.siteName) continue;
        
        // Fetch data from this specific DB/Collection
        const docs = await project.model.find({});
        const formattedDocs = docs.map(doc => formatDoc(doc, project.siteName));
        
        allLeads = [...allLeads, ...formattedDocs];
      }
      
      // Sort all combined leads by date across all databases
      allLeads.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return orderBy?.createdAt === 'asc' ? dateA - dateB : dateB - dateA;
      });
      
      return allLeads;
    },

    // Deletes a lead across any database
    delete: async ({ where }: { where: { id: string } }) => {
      // Since we don't know which DB the ID belongs to, try to delete it from all of them
      for (const project of projects) {
        const deleted = await project.model.findByIdAndDelete(where.id);
        if (deleted) return formatDoc(deleted, project.siteName);
      }
      return null;
    },

    // Tells the frontend sidebar which projects exist
    getUniqueSites: async (): Promise<string[]> => {
      return projects.map(p => p.siteName).sort();
    },
  },
};

// Seed default admin if none exists
AdminUser.countDocuments().then(async (count) => {
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await AdminUser.create({ username: 'admin', passwordHash });
    console.log('[DB] Seeded default admin user in boscore/admin_users.');
  }
});