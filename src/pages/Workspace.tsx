import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, LogOut, Settings, Users } from "lucide-react";
import supabase from "@/utils/supabase";
import { WorkspaceProject } from "@/types/workspace";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const Workspace = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let timeoutId: NodeJS.Timeout;

    // Subscribe to real-time project changes with debounce
    const channel = supabase
      .channel(`user:${user.id}:projects`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_projects",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log("Projects updated in real-time");
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            loadProjects(user.id);
          }, 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkAuth = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      navigate("/workspace-auth");
      return;
    }
    setUser(data.session.user);
    loadProjects(data.session.user.id);
  };

  const loadProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("workspace_projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !user) return;

    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from("workspace_projects")
        .insert([
          {
            user_id: user.id,
            name: newProjectName,
            description: newProjectDesc,
            invite_code: inviteCode,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setProjects([data, ...projects]);
      setNewProjectName("");
      setNewProjectDesc("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/workspace-auth");
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/workspace/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Workspace</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/workspace/settings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Create Project Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-light tracking-tight">
              {projects.length === 0
                ? "Create your first project"
                : `Projects (${projects.length})`}
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              New Project
            </motion.button>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            </div>
          ) : projects.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"
            >
              <p className="text-gray-500 mb-4">No projects yet</p>
              <p className="text-sm text-gray-400">
                Click "New Project" to get started
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleProjectClick(project.id)}
                  className="p-6 border border-gray-200 rounded-lg cursor-pointer hover:border-black hover:shadow-xl transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-lg group-hover:text-black transition-colors">
                      {project.name}
                    </h3>
                    <Users size={18} className="text-gray-400" />
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-xl font-medium mb-6">Create New Project</h3>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              onKeyPress={(e) => e.key === "Enter" && createProject()}
            />
            <textarea
              placeholder="Description (optional)"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Workspace;
