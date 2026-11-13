
import { useCallback, useEffect, useState } from "react";
import "./App.css";
document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })

const API_URL = "http://localhost:5000/api/tasks";

const priorityOrder = {
  veryhigh: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");

  // FETCH TASKS
  const fetchTasks = useCallback(async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch tasks");

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid task data");

    return data;
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadTasks = async () => {
      try {
        const data = await fetchTasks();
        if (!ignore) setTasks(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    loadTasks();

    return () => {
      ignore = true;
    };
  }, [fetchTasks]);

  // RESET FORM
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setEditingTaskId(null);
  };

  // ADD OR UPDATE TASK
  const addTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      const isEditing = Boolean(editingTaskId);

      const response = await fetch(
        isEditing ? `${API_URL}/${editingTaskId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            priority,
            dueDate: dueDate || null
          })
        }
      );

      if (!response.ok) throw new Error("Failed to save task");

      resetForm();
      setTasks(await fetchTasks());
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  // START EDITING
  const editTask = (task) => {
    setEditingTaskId(task._id);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "Medium");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // COMPLETE TASK
  const toggleTask = async (id, completed) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed })
      });

      if (!response.ok) throw new Error("Failed to update task");

      setTasks(await fetchTasks());
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // DELETE TASK
  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete task");

      if (editingTaskId === id) resetForm();

      setTasks(await fetchTasks());
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // SEARCH AND FILTER
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ||
      (filter === "Completed" && task.completed) ||
      (filter === "Pending" && !task.completed);

    return matchesSearch && matchesFilter;
  });
  const sortedTasks = [...filteredTasks].sort((a, b) => {
  if (sortOrder === "priority") {
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  }

  if (sortOrder === "lowToHigh") {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }

  return 0;
});

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>TaskFlow.</h2>
        <p
          className="nav-active"
          onClick={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
          }
          >
            Dashboard
          </p>
        <p
          onClick={() =>
          document.getElementById("my-tasks")?.scrollIntoView({
          behavior: "smooth"
          })
          }
          >
          My Tasks
            </p>
       </aside>

      <main className="main-content">
        <header>
          <h1>My Dashboard</h1>
          <p>Manage your work, one task at a time.</p>
        </header>

        <section className="stats">
  <div className="stat-card total-card">
    <span>Total Tasks</span>
    <h2>{tasks.length}</h2>
  </div>

  <div className="stat-card completed-card">
    <span>Completed</span>
    <h2>{tasks.filter(t => t.completed).length}</h2>
  </div>

  <div className="stat-card pending-card">
    <span>Pending</span>
    <h2>{tasks.filter(t => !t.completed).length}</h2>
  </div>
</section>

        <section className="task-section">
          <h2>{editingTaskId ? "Edit Task" : "Create New Task"}</h2>

          <form onSubmit={addTask} className="task-form">
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <textarea
              placeholder="Description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              className="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">🟢 Low Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="High">🔴 High Priority</option>
              <option value="veryhigh">🔴 very High Priority</option>
            </select>

            <label>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <button type="submit">
              {editingTaskId ? "Update Task" : "+ Add Task"}
            </button>

            {editingTaskId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </form>

          <div className="task-toolbar">
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="sort-select"
            >
              <option value="All" >All Tasks</option>
              <option value="Pending">Pending</option>
              <option value="Completed" >Completed</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="default">default</option>
              <option value="priority">High to Low</option>
              <option value="lowToHigh">Low to High</option>
            </select>
          </div>

          <div className="task-list" id="my-tasks">
            {filteredTasks.length === 0 ? (
              <p className="empty">No matching tasks found.</p>
            ) : (
              sortedTasks.map((task) => {
                const days = task.dueDate
                ? Math.ceil(
                  (new Date(task.dueDate).setHours(0, 0, 0, 0) -
                 new Date().setHours(0, 0, 0, 0)) /
                    (1000 * 60 * 60 * 24)
                    )
                    : null;

                    return (
                <div
                        className={
                        task.completed
                        ? "task-item completed-task"
                        : days < 0
                        ? "task-item overdue"
                        : "task-item pending-task"
                      }
                     key={task._id}
                    >
                  <div className="task-details">
                    <span
                      className={task.completed ? "completed" : ""}
                      onClick={() => toggleTask(task._id, task.completed)}
                    >
                      {task.completed ? "✓" : "○"} {task.title}
                    </span>

                    {task.description && <p>{task.description}</p>}

                    <small>
                      Priority: {task.priority || "Medium"}
                    </small>

                    {task.dueDate && (
                      <small>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                  {task.dueDate && !task.completed && (
                  <small
                    className={`deadline-indicator ${
                      days < 0 ? "deadline-overdue" : days === 0 ? "due-today" : "days-left"
                        }`}
                        >
                          {days > 0
                            ? `${days} days left`
                              : days === 0
                              ? "Due today"
                                : "Overdue"}
                               </small>
                                )}

                  <div className="task-actions">
                    <button
                      className="edit-btn"
                      onClick={() => editTask(task)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteTask(task._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
