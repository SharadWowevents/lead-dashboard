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

// ==========================================
// 2. SCHEMAS
// ==========================================
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

// New Analysis Schema for BO Score
const analysisSchema = new mongoose.Schema({
  // ref: 'LeadData' tells Mongoose to look inside the users collection for this ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadData' }, 
  name: String, // e.g., "Analysis on 9 Sept 2026, 3:44 pm"
  scores: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
}, { collection: 'analyses' }); // Update 'analyses' if your actual collection name is different


// ==========================================
// 3. YOUR DATA SOURCES CONFIGURATION
// ==========================================

// A. Local MongoDB Setup (For your local projects)
const boscoreDb = connection.useDb('boscore');

// Register Models
const AdminUser = boscoreDb.model('AdminUser', adminUserSchema, 'admin_users'); 
const LeadDataModel = boscoreDb.model('LeadData', leadDataSchema, 'users');
const AnalysisModel = boscoreDb.model('Analysis', analysisSchema, 'analyses');

const localProjects = [
  {
    siteName: 'BO Score',
    model: LeadDataModel
  }
];

// B. External APIs Setup (For your external projects)
const externalApis = [
  {
    siteName: '80-20 Book',
    prefix: '8020_',
    fetchUrl: 'https://api-80-20-book.wowos.in/api/leads',
    deleteUrl: (id: string) => `https://api-80-20-book.wowos.in/api/leads/${id}`,
    headers: { 'x-api-key': 'db2171d1d5a503502c434ab65fcb0ada8d42a7ba8f56ad678878' }
  },
  // {
  //   siteName: 'Project 3 (Second API)', // Change this to your second project's name
  //   prefix: 'API2_',
  //   fetchUrl: 'https://api-YOUR-SECOND-API.com/api/leads', 
  //   deleteUrl: (id: string) => `https://api-YOUR-SECOND-API.com/api/leads/${id}`, 
  //   headers: { 'x-api-key': 'YOUR_SECOND_API_KEY_HERE' } 
  // }
];


// ==========================================
// 4. DATABASE ABSTRACTION LOGIC
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
    create: async ({ data }: { data: any }) => {
      const targetProject = localProjects.find(p => p.siteName === data.siteName);
      if (!targetProject) throw new Error(`Project "${data.siteName}" is not local.`);
      const newDoc = await targetProject.model.create(data);
      return formatDoc(newDoc, targetProject.siteName);
    },

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
              id: `${api.prefix}${lead.id || lead._id}`,
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
          return null; 
        }
      }

      // 2. If no prefix matched, it's a Local MongoDB Lead
      for (const project of localProjects) {
        const deleted = await project.model.findByIdAndDelete(where.id);
        if (deleted) return formatDoc(deleted, project.siteName);
      }
      return null;
    },

    getUniqueSites: async (): Promise<string[]> => {
      const sites = [
        ...localProjects.map(p => p.siteName),
        ...externalApis.map(api => api.siteName)
      ];
      return sites.sort();
    },
  },

  // --- NEW: ANALYSIS DATA LOGIC (For BO Score) ---
  analysisData: {
    findMany: async () => {
      try {
        // Fetch analyses and automatically merge Name and Email from the LeadData (users) collection
        const docs = await AnalysisModel.find()
          .populate({ path: 'userId', select: 'name email' })
          .sort({ createdAt: -1 });

        return docs.map(doc => {
          const obj = doc.toObject();
          return {
            id: obj._id.toString(),
            name: obj.userId?.name || 'Unknown User',
            email: obj.userId?.email || 'N/A',
            analysisName: obj.name || 'Unknown Analysis', // The formatted date/time string from DB
            scores: obj.scores,
            createdAt: obj.createdAt || new Date()
          };
        });
      } catch (err) {
        console.error('[DB] Failed to fetch analyses:', err);
        return [];
      }
    }
  }
};

// Seed admin
AdminUser.countDocuments().then(async (count) => {
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await AdminUser.create({ username: 'admin', passwordHash });
    console.log('[DB] Seeded default admin user.');
  }
});