let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let showAll = false;

// 🔁 Auto refresh countdown every second
setInterval(() => {
  renderTasks();
}, 1000);

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const name = document.getElementById("taskName").value;
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;

  if (!name || !date || !time) {
    alert("Fill all fields");
    return;
  }

  tasks.push({
    id: Date.now(),
    name,
    date,
    time,
    completed: false
  });

  saveTasks();
  clearInputs();
  renderTasks();
}

function clearInputs() {
  document.getElementById("taskName").value = "";
  document.getElementById("taskDate").value = "";
  document.getElementById("taskTime").value = "";
}

function renderTasks() {
  const todayList = document.getElementById("pendingList");
  const upcomingList = document.getElementById("upcomingList");
  const completedList = document.getElementById("completedList");
  const allTasksList = document.getElementById("allTasksList");

  todayList.innerHTML = "";
  upcomingList.innerHTML = "";
  completedList.innerHTML = "";
  if (allTasksList) allTasksList.innerHTML = "";

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Sort by date + time
  tasks.sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA - dateB;
  });

  tasks.forEach(task => {
    const li = createTaskElement(task, now);

    if (showAll && allTasksList) {
      allTasksList.appendChild(li);
    } else {
      if (task.completed) {
        completedList.appendChild(li);
      } else if (task.date === today) {
        todayList.appendChild(li);
      } else if (task.date > today) {
        upcomingList.appendChild(li);
      } else {
        todayList.appendChild(li);
      }
    }
  });
}

function createTaskElement(task, now) {
  const li = document.createElement("li");

  const taskDateTime = new Date(task.date + "T" + task.time);
  const timeDiff = taskDateTime - now;

  let countdownText = "";
  let isOverdue = false;

  if (timeDiff <= 0 && !task.completed) {
    countdownText = "Overdue";
    isOverdue = true;
  } else if (!task.completed) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
  }

  li.innerHTML = `
    <div class="${task.completed ? "completed" : ""}">
      <strong>${task.name}</strong>
    </div>
    <div class="task-date">
      📅 ${task.date} | ⏰ ${task.time}
    </div>
    <div class="countdown ${isOverdue ? "overdue-text" : ""}">
      ${task.completed ? "Completed" : countdownText}
    </div>
    <div class="btn-group">
      <button class="complete-btn" onclick="toggleComplete(${task.id})">
        ${task.completed ? "Undo" : "Complete"}
      </button>
      <button class="edit-btn" onclick="editTask(${task.id})">
        Edit
      </button>
      <button class="delete-btn" onclick="deleteTask(${task.id})">
        Delete
      </button>
    </div>
  `;

  if (isOverdue) {
    li.classList.add("overdue");
  }

  return li;
}

function toggleComplete(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);

  const newName = prompt("Edit task name:", task.name);
  const newDate = prompt("Edit date (YYYY-MM-DD):", task.date);
  const newTime = prompt("Edit time (HH:MM):", task.time);

  if (newName && newDate && newTime) {
    task.name = newName;
    task.date = newDate;
    task.time = newTime;
    saveTasks();
    renderTasks();
  }
}

function toggleAllTasks() {
  showAll = !showAll;

  document.getElementById("allTasksSection").style.display =
    showAll ? "block" : "none";
  document.getElementById("normalView").style.display =
    showAll ? "none" : "block";

  document.querySelector(".view-btn").innerText =
    showAll ? "Back to Categorized View" : "Show All Tasks";

  renderTasks();
}

// Initial render when page loads
renderTasks();
// Wait until DOM loads
document.addEventListener("DOMContentLoaded", function () {

    const exportBtn = document.getElementById("exportBtn");
    const importBtn = document.getElementById("importBtn");
    const importFile = document.getElementById("importFile");

    // ===== EXPORT BACKUP =====
    exportBtn.addEventListener("click", () => {

        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

        if (tasks.length === 0) {
            alert("No tasks available to export.");
            return;
        }

        const blob = new Blob(
            [JSON.stringify(tasks, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "task_backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    });

    // ===== IMPORT BACKUP =====
    importBtn.addEventListener("click", () => {
        importFile.click();
    });

    importFile.addEventListener("change", (event) => {

        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== "application/json") {
            alert("Please select a valid JSON file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const importedTasks = JSON.parse(e.target.result);

                if (!Array.isArray(importedTasks)) {
                    alert("Invalid backup format.");
                    return;
                }

                // Optional: Confirm before replacing
                const confirmReplace = confirm("This will replace existing tasks. Continue?");
                if (!confirmReplace) return;

                localStorage.setItem("tasks", JSON.stringify(importedTasks));

                alert("Backup imported successfully!");
                location.reload();

            } catch (error) {
                alert("Error reading file. Invalid JSON.");
            }
        };

        reader.readAsText(file);

        // Reset input
        importFile.value = "";
    });

});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch(err => console.log("Service Worker Failed", err));
}