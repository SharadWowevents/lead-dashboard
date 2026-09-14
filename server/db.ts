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

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadData' }, 
  name: String,
  scores: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
}, { collection: 'analyses' });

// Schema for 101 Business Prompts
const promptSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Marketing', 'Sales', 'Delivery', 'Finance', 'People', 'AI'] 
  },
  title: { type: String, required: true },
  prompt: { type: String, required: true }
}, { timestamps: true });

// ==========================================
// 3. YOUR DATA SOURCES CONFIGURATION
// ==========================================

// A. Local Databases
const boscoreDb = connection.useDb('boscore');
// Database where your 101 Prompts & Users reside (defaults to 'wowos_prompts')
const promptDbName = process.env.PROMPT_DB_NAME || 'wowos_prompts';
const promptDb = connection.useDb(promptDbName);

// Register Models
const AdminUser = boscoreDb.model('AdminUser', adminUserSchema, 'admin_users'); 
const LeadDataModel = boscoreDb.model('LeadData', leadDataSchema, 'users');
const AnalysisModel = boscoreDb.model('Analysis', analysisSchema, 'analyses');

// Register 101 Business Prompts Models
const PromptLeadModel = promptDb.model('PromptUser', leadDataSchema, 'users');
const PromptModel = promptDb.model('Prompt', promptSchema, 'prompts');

const localProjects = [
  {
    siteName: 'BO Score',
    model: LeadDataModel
  },
  {
    siteName: '101 Business Prompts',
    model: PromptLeadModel
  }
];

// B. External APIs Setup
const externalApis = [
  {
    siteName: '80-20 Book',
    prefix: '8020_',
    fetchUrl: 'https://api-80-20-book.wowos.in/api/leads',
    deleteUrl: (id: string) => `https://api-80-20-book.wowos.in/api/leads/${id}`,
    headers: { 'x-api-key': 'db2171d1d5a503502c434ab65fcb0ada8d42a7ba8f56ad678878' }
  },
  // --- NEW: Resource Allocator API ---
  {
    siteName: 'Resource Allocator',
    prefix: 'RES_',
    fetchUrl: 'https://resourcesapi.wowos.in/api/leads', // Update to public URL if not hosted on the same server
    deleteUrl: (email: string) => `https://resourcesapi.wowos.in/api/leads/${email}`,
    headers: {} 
  }
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
      
      // 1. Fetch from Local MongoDB databases
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
              // Fallback to email if `id` or `_id` doesn't exist (required for Resource Allocator)
              id: `${api.prefix}${lead.id || lead._id || lead.email}`,
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
      
      // 3. Sort by date
      allLeads.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return orderBy?.createdAt === 'asc' ? dateA - dateB : dateB - dateA;
      });
      
      return allLeads;
    },

    delete: async ({ where }: { where: { id: string } }) => {
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

  // --- ANALYSIS DATA LOGIC (For BO Score) ---
  analysisData: {
    findMany: async () => {
      try {
        const docs = await AnalysisModel.find()
          .populate({ path: 'userId', select: 'name email mobile' }) // Ensured mobile is requested
          .sort({ createdAt: -1 });

        return docs.map(doc => {
          const obj = doc.toObject();
          return {
            id: obj._id.toString(),
            name: obj.userId?.name || 'Unknown User',
            email: obj.userId?.email || 'N/A',
            mobile: obj.userId?.mobile || 'N/A', // Changed phone to mobile for correct mapping
            analysisName: obj.name || 'Unknown Analysis',
            scores: obj.scores,
            createdAt: obj.createdAt || new Date()
          };
        });
      } catch (err) {
        console.error('[DB] Failed to fetch analyses:', err);
        return [];
      }
    }
  },

  // --- NEW: RESOURCE LOGS LOGIC ---
  resourceLogs: {
    findMany: async () => {
      try {
        // IMPORTANT: Change localhost:5000 to your live URL when deployed!
        const res = await fetch('https://resourcesapi.wowos.in/api/logs');
        if (res.ok) {
          const rawData = await res.json();
          // The API returns the array directly
          return Array.isArray(rawData) ? rawData : [];
        }
        return [];
      } catch (err) {
        console.error('[DB] Failed to fetch resource logs:', err);
        return [];
      }
    }
  },

  // --- PROMPTS CRUD LOGIC (For 101 Business Prompts) ---
  prompt: {
    findMany: async ({ category, search }: { category?: string; search?: string } = {}) => {
      const filter: any = {};
      if (category && category.toLowerCase() !== 'all') {
        filter.category = new RegExp(`^${category}$`, 'i');
      }
      if (search && search.trim()) {
        const q = search.trim();
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { prompt: { $regex: q, $options: 'i' } }
        ];
      }
      const docs = await PromptModel.find(filter).sort({ number: 1 });
      return docs.map(doc => {
        const obj = doc.toObject();
        return { ...obj, id: obj._id.toString(), _id: undefined, __v: undefined };
      });
    },

    findById: async (id: string) => {
      const doc = await PromptModel.findById(id);
      if (!doc) return null;
      const obj = doc.toObject();
      return { ...obj, id: obj._id.toString(), _id: undefined, __v: undefined };
    },

    create: async (data: { number?: number; category: string; title: string; prompt: string }) => {
      let promptNumber = data.number;
      if (!promptNumber) {
        const last = await PromptModel.findOne().sort({ number: -1 });
        promptNumber = last && last.number ? last.number + 1 : 1;
      }

      const newDoc = await PromptModel.create({
        ...data,
        number: promptNumber
      });
      const obj = newDoc.toObject();
      return { ...obj, id: obj._id.toString(), _id: undefined, __v: undefined };
    },

    update: async (id: string, data: { number?: number; category?: string; title?: string; prompt?: string }) => {
      const updated = await PromptModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      if (!updated) return null;
      const obj = updated.toObject();
      return { ...obj, id: obj._id.toString(), _id: undefined, __v: undefined };
    },

    delete: async (id: string) => {
      const deleted = await PromptModel.findByIdAndDelete(id);
      if (!deleted) return null;
      return { id };
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