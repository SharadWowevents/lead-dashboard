import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// 1. BASE MONGODB CONNECTION
// ==========================================
const BASE_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const connection = mongoose.createConnection(BASE_URI);

connection.on('connected', () => console.log(`[DB] Connected to MongoDB`));
connection.on('error', (err) => console.error('[DB] Connection error:', err));
export const isPrismaConnected = true;

// Schemas
const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const leadDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, default: 'N/A' },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });


// ==========================================
// 2. YOUR DATA SOURCES CONFIGURATION
// ==========================================

// A. Local MongoDB Setup (For your 1 local project)
const adminDb = connection.useDb('boscore');
const AdminUser = adminDb.model('AdminUser', adminUserSchema, 'admin_users'); 

const localProjects = [
  {
    siteName: 'BO Score',
    model: connection.useDb('boscore').model('LeadData', leadDataSchema, 'users')
  }
];

// B. External APIs Setup (For your 2 external projects)
const externalApis = [
  {
    siteName: '80-20 Book',
    prefix: '8020_', // Prefix added to ID so the backend knows which API to delete from
    fetchUrl: 'https://api-80-20-book.wowos.in/api/leads',
    deleteUrl: (id: string) => `https://api-80-20-book.wowos.in/api/leads/${id}`,
    headers: { 'x-api-key': 'db2171d1d5a503502c434ab65fcb0ada8d42a7ba8f56ad678878' }
  },
  {
    siteName: 'Project 3 (Second API)', // Change this to your second project's name
    prefix: 'API2_',
    fetchUrl: 'https://api-YOUR-SECOND-API.com/api/leads', // REPLACE THIS
    deleteUrl: (id: string) => `https://api-YOUR-SECOND-API.com/api/leads/${id}`, // REPLACE THIS
    headers: { 'x-api-key': 'YOUR_SECOND_API_KEY_HERE' } // REPLACE THIS
  }
];


// ==========================================
// 3. DATABASE ABSTRACTION LOGIC
// ==========================================

const formatDoc = (doc: any, siteName: string) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id.toString(), siteName, _id: undefined, __v: undefined };
};

export const db = {
  // --- ADMIN LOGIC ---
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

  // --- MULTI-SOURCE LEADS LOGIC ---
  leadData: {
    // CREATE (Only applies to local MongoDB)
    create: async ({ data }: { data: any }) => {
      const targetProject = localProjects.find(p => p.siteName === data.siteName);
      if (!targetProject) throw new Error(`Project "${data.siteName}" is not local.`);
      const newDoc = await targetProject.model.create(data);
      return formatDoc(newDoc, targetProject.siteName);
    },

    // READ (Fetches from Local DB + Both APIs)
    findMany: async ({ where, orderBy }: { where?: { siteName?: string }; orderBy?: any } = {}) => {
      let allLeads: any[] = [];
      
      // 1. Fetch from Local MongoDB
      for (const project of localProjects) {
        if (where?.siteName && where.siteName !== project.siteName) continue;
        const docs = await project.model.find({});
        allLeads = [...allLeads, ...docs.map(doc => formatDoc(doc, project.siteName))];
      }

      // 2. Fetch from External APIs
      for (const api of externalApis) {
        if (where?.siteName && where.siteName !== api.siteName) continue;
        
        try {
          const res = await fetch(api.fetchUrl, { headers: api.headers });
          if (res.ok) {
            const rawData = await res.json();
            const leadsArray = Array.isArray(rawData) ? rawData : (rawData.data || []);
            
            const formattedExt = leadsArray.map((lead: any) => ({
              id: `${api.prefix}${lead.id || lead._id}`, // Attach prefix
              siteName: api.siteName,
              name: lead.name || 'Unknown',
              email: lead.email || 'N/A',
              mobile: lead.mobile || lead.phone || 'N/A',
              createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date()
            }));
            allLeads = [...allLeads, ...formattedExt];
          }
        } catch (err) {
          console.error(`[DB] Failed to fetch leads from ${api.siteName}:`, err);
        }
      }
      
      // 3. Sort all combined data by date
      allLeads.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return orderBy?.createdAt === 'asc' ? dateA - dateB : dateB - dateA;
      });
      
      return allLeads;
    },

    // DELETE (Routes to Mongo OR correct API based on ID prefix)
    delete: async ({ where }: { where: { id: string } }) => {
      // 1. Check if it's an external API Lead
      for (const api of externalApis) {
        if (where.id.startsWith(api.prefix)) {
          const realId = where.id.replace(api.prefix, '');
          try {
            const res = await fetch(api.deleteUrl(realId), { method: 'DELETE', headers: api.headers });
            if (res.ok) return { id: where.id, siteName: api.siteName };
          } catch (err) {
            console.error(`[DB] Failed to delete from ${api.siteName}:`, err);
          }
          return null; // Stop here since we found the prefix match
        }
      }

      // 2. If no prefix matched, it's a Local MongoDB Lead
      for (const project of localProjects) {
        const deleted = await project.model.findByIdAndDelete(where.id);
        if (deleted) return formatDoc(deleted, project.siteName);
      }
      return null;
    },

    // SITES LIST (For the sidebar)
    getUniqueSites: async (): Promise<string[]> => {
      const sites = [
        ...localProjects.map(p => p.siteName),
        ...externalApis.map(api => api.siteName)
      ];
      return sites.sort();
    },
  },
};

// Seed admin
AdminUser.countDocuments().then(async (count) => {
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await AdminUser.create({ username: 'admin', passwordHash });
  }
});