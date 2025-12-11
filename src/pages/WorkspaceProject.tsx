import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowLeft,
  Users,
  Settings,
  Mail,
  MoreVertical,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import supabase from "@/utils/supabase";
import { useTheme } from "@/context/ThemeContext";
import type { Board, TeamMember } from "@/types/workspace";
import type { WorkspaceProject as WorkspaceProjectType } from "@/types/workspace";
import KanbanBoard from "@/components/KanbanBoard";

const WorkspaceProject = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { isDark, toggleTheme } = useTheme();
  const [project, setProject] = useState<WorkspaceProjectType | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadProjectData();

      // Subscribe to real-time changes
      const channel = supabase
        .channel(`project:${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "boards",
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            console.log("Boards updated");
            loadProjectData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_members",
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            console.log("Team members updated");
            loadProjectData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [projectId]);

  const checkAuth = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      navigate("/workspace-auth");
      return;
    }
    setUser(data.session.user);
  };

  const loadProjectData = async () => {
    if (!projectId) return;

    try {
      // Get project
      const { data: projectData, error: projectError } = await supabase
        .from("workspace_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Project load error:", projectError);
        throw projectError;
      }
      console.log("Project loaded:", projectData);
      setProject(projectData);

      // Get boards
      const { data: boardsData, error: boardsError } = await supabase
        .from("boards")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (boardsError) throw boardsError;
      setBoards(boardsData || []);
      if (boardsData && boardsData.length > 0) {
        setSelectedBoard(boardsData[0]);
      }

      // Get team members
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("*, user:user_id(*)")
        .eq("project_id", projectId);

      if (membersError) throw membersError;
      setTeamMembers(membersData || []);
    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    if (!projectId || !newBoardName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("boards")
        .insert([
          {
            project_id: projectId,
            name: newBoardName,
            description: newBoardDesc,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setBoards([data, ...boards]);
      setSelectedBoard(data);
      setNewBoardName("");
      setNewBoardDesc("");
      setShowNewBoardModal(false);
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const inviteMember = async () => {
    if (!projectId || !inviteEmail.trim()) return;

    try {
      // First, find user by email (you might need to adjust this based on your user table structure)
      const { data: userData, error: userError } = await supabase
        .from("workspace_users")
        .select("id")
        .eq("email", inviteEmail)
        .single();

      if (userError) {
        alert("User not found with that email");
        return;
      }

      const { error: inviteError } = await supabase
        .from("team_members")
        .insert([
          {
            project_id: projectId,
            user_id: userData.id,
            role: "member",
          },
        ]);

      if (inviteError) throw inviteError;

      setInviteEmail("");
      setShowInviteModal(false);
      loadProjectData();
    } catch (error) {
      console.error("Error inviting member:", error);
    }
  };

  const deleteBoard = async (boardId: string) => {
    try {
      const { error } = await supabase
        .from("boards")
        .delete()
        .eq("id", boardId);

      if (error) throw error;

      const newBoards = boards.filter((b) => b.id !== boardId);
      setBoards(newBoards);
      setSelectedBoard(newBoards[0] || null);
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  const copyInviteLink = () => {
    if (!project) {
      alert("Project not loaded yet");
      return;
    }
    if (!project.invite_code) {
      alert("No invite code for this project");
      return;
    }
    const inviteUrl = `${window.location.origin}/workspace/invite/${project.invite_code}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied: " + inviteUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-b ${isDark ? "bg-black border-white" : "bg-white border-gray-200"} sticky top-0 z-40 backdrop-blur-sm`}
      >
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/workspace")}
              className={`flex items-center gap-2 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"} transition-colors`}
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? "border-white bg-black" : "border-gray-300 bg-gray-50"}`}>
                <Search size={18} className={isDark ? "text-white" : "text-gray-600"} />
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-40 bg-transparent outline-none ${isDark ? "text-white placeholder-gray-300" : "text-black placeholder-gray-400"}`}
                />
              </div>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDark ? "bg-white hover:bg-gray-100 text-black" : "bg-black hover:bg-gray-900 text-white"}`}
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={copyInviteLink}
                disabled={!project?.invite_code}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "border-white hover:border-white hover:bg-white hover:text-black" : "border-gray-300 hover:border-black hover:bg-black hover:text-white"}`}
                title="Copy invite link"
              >
                <Users size={18} />
                Share
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${isDark ? "border-white hover:border-white hover:bg-white hover:text-black" : "border-gray-300 hover:border-black hover:bg-black hover:text-white"}`}
              >
                <Mail size={18} />
                Invite
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white hover:text-black" : "hover:bg-black hover:text-white"}`}>
                <Settings size={20} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-3xl font-light tracking-tight mb-1">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>

          {/* Board Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 overflow-x-auto pb-2"
          >
            {boards.map((board) => (
              <motion.div
                key={board.id}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <button
                  onClick={() => setSelectedBoard(board)}
                  className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedBoard?.id === board.id
                      ? "bg-black text-white"
                      : "bg-gray-100 text-black hover:bg-gray-200"
                  }`}
                >
                  {board.name}
                </button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => deleteBoard(board.id)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition-opacity"
                >
                  ×
                </motion.button>
              </motion.div>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewBoardModal(true)}
              className="px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              New
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-full px-6 py-8">
        {selectedBoard ? (
          <motion.div
            key={selectedBoard.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-light tracking-tight mb-6">
              {selectedBoard.name}
            </h2>
            <KanbanBoard boardId={selectedBoard.id} projectId={projectId!} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 mb-4">No boards yet</p>
            <button
              onClick={() => setShowNewBoardModal(true)}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Create First Board
            </button>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showNewBoardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewBoardModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl ${
                isDark
                  ? "bg-black border border-white text-white"
                  : "bg-white text-black"
              }`}
            >
              <h3 className="text-xl font-medium mb-6">Create New Board</h3>
              <input
                type="text"
                placeholder="Board name (e.g., Design, Music)"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg mb-4 focus:outline-none focus:ring-1 transition-colors ${
                  isDark
                    ? "bg-gray-900 text-white border-gray-700 focus:border-white focus:ring-white placeholder-gray-400"
                    : "bg-white text-black border-gray-300 focus:border-black focus:ring-black placeholder-gray-600"
                }`}
                onKeyPress={(e) => e.key === "Enter" && createBoard()}
              />
              <textarea
                placeholder="Description (optional)"
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg mb-6 focus:outline-none focus:ring-1 transition-colors resize-none ${
                  isDark
                    ? "bg-gray-900 text-white border-gray-700 focus:border-white focus:ring-white placeholder-gray-400"
                    : "bg-white text-black border-gray-300 focus:border-black focus:ring-black placeholder-gray-600"
                }`}
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewBoardModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "border border-gray-700 text-white hover:bg-gray-900"
                      : "border border-gray-300 text-black hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={createBoard}
                  disabled={!newBoardName.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-medium mb-6">Invite to Project</h3>

              {/* Team Members List */}
              <div className="mb-6 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  Team Members ({teamMembers.length})
                </p>
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm">{member.user?.email}</span>
                      <span className="text-xs text-gray-500 uppercase">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Input */}
              <div className="space-y-4 border-t pt-4">
                <input
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  onKeyPress={(e) => e.key === "Enter" && inviteMember()}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={inviteMember}
                    disabled={!inviteEmail.trim()}
                    className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Mail size={16} />
                    Invite
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceProject;
