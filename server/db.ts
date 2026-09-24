import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// 1. BASE MONGODB CONNECTION (Build-Safe)
// ==========================================
const isBuilding = process.env.npm_lifecycle_event === 'build';
const BASE_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';

let connection: any;

if (isBuilding) {
  console.log('[DB] Skipping MongoDB connection during Vite build to prevent hanging.');
  // Dummy connection so the ES Module parses without errors or open sockets
  connection = {
    useDb: () => ({
      model: () => ({})
    }),
    on: () => { }
  };
} else {
  // Live connection
  connection = mongoose.createConnection(BASE_URI);
  connection.on('connected', () => console.log(`[DB] Connected to MongoDB`));
  connection.on('error', (err) => console.error('[DB] Connection error:', err));
}

export const isPrismaConnected = true;

// ==========================================
// 2. SCHEMAS
// ==========================================
const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const promptLogSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  userMobile: String,
  promptId: String,
  promptTitle: String,
  originalTemplate: String,
  filledInputs: mongoose.Schema.Types.Mixed,
  finalFilledPrompt: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'promptlogs' });

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
const promptDbName = process.env.PROMPT_DB_NAME || 'wowos_prompts';
const promptDb = connection.useDb(promptDbName);

// Register Models
const AdminUser = boscoreDb.model('AdminUser', adminUserSchema, 'admin_users');
const LeadDataModel = boscoreDb.model('LeadData', leadDataSchema, 'users');
const AnalysisModel = boscoreDb.model('Analysis', analysisSchema, 'analyses');

const PromptLeadModel = promptDb.model('PromptUser', leadDataSchema, 'users');
const PromptModel = promptDb.model('Prompt', promptSchema, 'prompts');
const PromptLogModel = promptDb.model('PromptLog', promptLogSchema, 'promptlogs');

const localProjects = [
  { siteName: 'BO Score', model: LeadDataModel },
  { siteName: '101 Business Prompts', model: PromptLeadModel }
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
  {
    siteName: 'Resource Allocator',
    prefix: 'RES_',
    fetchUrl: 'https://resourcesapi.wowos.in/api/leads',
    deleteUrl: (email: string) => `https://resourcesapi.wowos.in/api/leads/${email}`,
    headers: {}
  },
  {
    siteName: 'Sachin Talwar Page',
    prefix: 'STP_',
    fetchUrl: 'https://api.sachintalwar.com/api/leads?limit=1000&skip=0',
    deleteUrl: (id: string) => `https://api.sachintalwar.com/api/leads/${id}`,
    headers: { 'x-api-key': 'hlVbjkYo9gNhVdhvMdYjB9Q0VZ6NkKfP' }
  },
  {
    siteName: 'WOWOS Score',
    prefix: 'WOWOS_',
    fetchUrl: 'https://scoreapi.wowos.in/api/leads?limit=1000',
    deleteUrl: (id: string) => `https://scoreapi.wowos.in/api/leads/${id}`,
    headers: { 'x-api-key': 'lM2SpmkwXyQzRx1nX9CXjHLRSiW46RVK' }
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

  // --- PROMPT LOGS LOGIC ---
  promptLogs: {
    findMany: async () => {
      try {
        const docs = await PromptLogModel.find().sort({ createdAt: -1 });
        return docs.map(doc => {
          const obj = doc.toObject();
          return {
            id: obj._id.toString(),
            userName: obj.userName || 'Unknown User',
            userEmail: obj.userEmail || 'N/A',
            userMobile: obj.userMobile || 'N/A',
            promptTitle: obj.promptTitle || 'Unknown Prompt',
            finalFilledPrompt: obj.finalFilledPrompt || '',
            createdAt: obj.createdAt || new Date()
          };
        });
      } catch (err) {
        console.error('[DB] Failed to fetch prompt logs:', err);
        return [];
      }
    }
  },

  // --- WOWOS SCORE ASSESSMENT LOGS ---
  wowosScoreLogs: {
    findMany: async () => {
      try {
        const res = await fetch('https://scoreapi.wowos.in/api/leads?limit=1000', {
          headers: { 'x-api-key': 'lM2SpmkwXyQzRx1nX9CXjHLRSiW46RVK' }
        });
        if (res.ok) {
          const rawData = await res.json();
          const array = Array.isArray(rawData) ? rawData : (rawData.data || []);
          return array.map((item: any) => ({
            id: item.id || item._id,
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
            email: item.email || 'N/A',
            mobile: item.mobile || 'N/A',
            status: item.assessment?.status || 'N/A',
            yesCount: item.assessment?.yesCount ?? 'N/A',
            yesTotal: item.assessment?.yesTotal ?? 15,
            percentage: item.assessment?.score?.percentage ?? 0,
            tier: item.assessment?.score?.tier || 'N/A',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
          }));
        }
        return [];
      } catch (err) {
        console.error('[DB] Failed to fetch WOWOS Score logs:', err);
        return [];
      }
    }
  },

  leadData: {
    create: async ({ data }: { data: any }) => {
      const targetProject = localProjects.find(p => p.siteName === data.siteName);
      if (!targetProject) throw new Error(`Project "${data.siteName}" is not local.`);
      const newDoc = await targetProject.model.create(data);
      return formatDoc(newDoc, targetProject.siteName);
    },

    findMany: async ({ where, orderBy }: { where?: { siteName?: string }; orderBy?: any } = {}) => {
      let allLeads: any[] = [];

      for (const project of localProjects) {
        if (where?.siteName && where.siteName !== project.siteName) continue;
        const docs = await project.model.find({});
        allLeads = [...allLeads, ...docs.map(doc => formatDoc(doc, project.siteName))];
      }

      for (const api of externalApis) {
        if (where?.siteName && where.siteName !== api.siteName) continue;

        try {
          const res = await fetch(api.fetchUrl, { headers: api.headers });
          if (res.ok) {
            const rawData = await res.json();
            const leadsArray = Array.isArray(rawData) ? rawData : (rawData.data || []);

            const formattedExt = leadsArray.map((lead: any) => {
              const combinedName = lead.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : null;
              return {
                id: `${api.prefix}${lead.id || lead._id || lead.email}`,
                siteName: api.siteName,
                name: lead.name || combinedName || 'Unknown',
                email: lead.email || 'N/A',
                mobile: lead.mobile || lead.phone || 'N/A',
                createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date()
              };
            });
            allLeads = [...allLeads, ...formattedExt];
          }
        } catch (err) {
          console.error(`[DB] Failed to fetch leads from ${api.siteName}:`, err);
        }
      }

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

  analysisData: {
    findMany: async () => {
      try {
        const docs = await AnalysisModel.find()
          .populate({ path: 'userId', select: 'name email mobile' })
          .sort({ createdAt: -1 });

        return docs.map(doc => {
          const obj = doc.toObject();
          return {
            id: obj._id.toString(),
            name: obj.userId?.name || 'Unknown User',
            email: obj.userId?.email || 'N/A',
            mobile: obj.userId?.mobile || 'N/A',
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

  resourceLinks: {
    findMany: async () => {
      try {
        const res = await fetch('https://resourcesapi.wowos.in/api/resources');
        return res.ok ? await res.json() : [];
      } catch (err) {
        console.error('[DB] Failed to fetch resources:', err);
        return [];
      }
    },
    create: async (data: { name: string; link: string }) => {
      const res = await fetch('https://resourcesapi.wowos.in/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create resource');
      return await res.json();
    },
    update: async (id: string, data: { name: string; link: string }) => {
      const res = await fetch(`https://resourcesapi.wowos.in/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update resource');
      return await res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`https://resourcesapi.wowos.in/api/resources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete resource');
      return { id };
    }
  },

  resourceLogs: {
    findMany: async () => {
      try {
        const res = await fetch('https://resourcesapi.wowos.in/api/logs');
        if (res.ok) {
          const rawData = await res.json();
          return Array.isArray(rawData) ? rawData : [];
        }
        return [];
      } catch (err) {
        console.error('[DB] Failed to fetch resource logs:', err);
        return [];
      }
    }
  },

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
      const newDoc = await PromptModel.create({ ...data, number: promptNumber });
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

// Only run the admin seeder if we are actually running the server (not building)
if (!isBuilding) {
  AdminUser.countDocuments().then(async (count) => {
    if (count === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await AdminUser.create({ username: 'admin', passwordHash });
      console.log('[DB] Seeded default admin user.');
    }
  }).catch(err => console.error('[DB] Seeding error:', err));
}