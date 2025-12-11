import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, User } from "lucide-react";
import supabase from "@/utils/supabase";
import { Task, BoardColumn, TaskStatus } from "@/types/workspace";

interface KanbanBoardProps {
  boardId: string;
  projectId: string;
}

const columnConfig: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  planned: { label: "В планах", color: "text-gray-600", bgColor: "bg-gray-50" },
  in_progress: {
    label: "Делается",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  done: { label: "Сделано", color: "text-green-600", bgColor: "bg-green-50" },
  abandoned: {
    label: "Брошено",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

const KanbanBoard = ({ boardId, projectId }: KanbanBoardProps) => {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState<TaskStatus | null>(
    null
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  useEffect(() => {
    loadData();
  }, [boardId]);

  useEffect(() => {
    if (!projectId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          console.log("Realtime update detected, reloading...");
          loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_columns",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          console.log("Columns updated");
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadData = async () => {
    try {
      const statuses: TaskStatus[] = ["planned", "in_progress", "done", "abandoned"];

      // Create or get columns
      const { data: columnsData, error: columnsError } = await supabase
        .from("board_columns")
        .select("*")
        .eq("project_id", projectId)
        .in("status", statuses);

      if (columnsError) {
        console.error("Columns error:", columnsError);
        throw columnsError;
      }

      if (!columnsData || columnsData.length === 0) {
        console.log("Creating default columns...");
        // Create default columns
        const newColumns = statuses.map((status, index) => ({
          project_id: projectId,
          name: columnConfig[status].label,
          status,
          order: index,
        }));

        const { data: createdCols, error: createError } = await supabase
          .from("board_columns")
          .insert(newColumns)
          .select();

        if (createError) {
          console.error("Create columns error:", createError);
          throw createError;
        }
        console.log("Created columns:", createdCols);
        setColumns(createdCols || []);
      } else {
        console.log("Loaded columns:", columnsData);
        setColumns(columnsData);
      }

      // Load tasks - filter by board_id, not project_id
      // First get the board to have its ID
      const boardIdToUse = columns.length > 0 ? columns[0].project_id : projectId;
      
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*, creator:created_by(id, email)")
        .eq("project_id", projectId);

      if (tasksError) {
        console.error("Tasks error:", tasksError);
        throw tasksError;
      }
      console.log("Loaded tasks:", tasksData);
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error loading board data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;

    const column = columns.find((c) => c.status === status);
    if (!column) return;

    try {
      const { data: userData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            column_id: column.id,
            project_id: projectId,
            title: newTaskTitle,
            created_by: userData?.session?.user?.id,
            completed: false,
            order: tasks.filter((t) => {
              const col = columns.find((c) => c.id === t.column_id);
              return col?.status === status;
            }).length,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setTasks([...tasks, data]);
      setNewTaskTitle("");
      setShowNewTaskModal(null);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const newColumn = columns.find((c) => c.status === newStatus);
      if (!newColumn) return;

      const { error } = await supabase
        .from("tasks")
        .update({ column_id: newColumn.id })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, column_id: newColumn.id } : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  const updateTaskTitle = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ title: newTitle })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, title: newTitle } : t
        )
      );
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error updating task title:", error);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  console.log("KanbanBoard render:", { sortedColumns, tasks, loading });

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 pt-4 w-full">
      <AnimatePresence mode="popLayout">
        {sortedColumns.map((column) => {
          const columnTasks = tasks.filter((t) => t.column_id === column.id);
          const columnConfig_item =
            columnConfig[column.status as TaskStatus];

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-shrink-0 w-80"
            >
              {/* Column Header */}
              <div className="mb-4">
                <h3 className={`font-medium text-sm ${columnConfig_item.color}`}>
                  {columnConfig_item.label} ({columnTasks.length})
                </h3>
              </div>

              {/* Droppable Area */}
              <motion.div
                className={`${columnConfig_item.bgColor} rounded-lg p-4 min-h-96 space-y-3 transition-colors`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("ring-2", "ring-black");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("ring-2", "ring-black");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("ring-2", "ring-black");
                  if (draggedTask) {
                    updateTaskStatus(
                      draggedTask.id,
                      column.status as TaskStatus
                    );
                    setDraggedTask(null);
                  }
                }}
              >
                {/* Tasks */}
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ y: -2 }}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => setDraggedTask(null)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div
                          onClick={() => toggleTaskComplete(task)}
                          className="flex items-center gap-2 flex-1"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-black"
                          />
                          {editingTaskId === task.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              onBlur={() => updateTaskTitle(task.id, editingTaskTitle)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateTaskTitle(task.id, editingTaskTitle);
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                }
                              }}
                              className="flex-1 px-2 py-1 border border-black rounded font-medium text-sm"
                            />
                          ) : (
                            <span
                              onDoubleClick={() => {
                                setEditingTaskId(task.id);
                                setEditingTaskTitle(task.title);
                              }}
                              className={`font-medium text-sm flex-1 cursor-text ${
                                task.completed
                                  ? "line-through text-gray-400"
                                  : "text-black"
                              }`}
                            >
                              {task.title}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                        >
                          <X size={16} className="text-red-600" />
                        </button>
                      </div>

                      {/* Task Meta */}
                      <div className="space-y-2 text-xs text-gray-500">
                        {task.creator && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>Создал: {task.creator.email || "Unknown"}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {task.assigned_to && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>Назначен: {task.assignee?.email || task.assigned_to}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="mt-2 text-xs text-gray-600">
                          {task.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add Task Button */}
                {showNewTaskModal === column.status ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") createTask(column.status as TaskStatus);
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          createTask(column.status as TaskStatus)
                        }
                        className="flex-1 px-3 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowNewTaskModal(null);
                          setNewTaskTitle("");
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNewTaskModal(column.status as TaskStatus)}
                    className="w-full py-2 text-sm text-gray-600 hover:text-black flex items-center justify-center gap-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add task
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default KanbanBoard;
