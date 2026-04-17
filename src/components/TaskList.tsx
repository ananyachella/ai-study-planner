import { useState } from 'react'
import { Task } from '../types'

interface TaskListProps {
  planId: number
}

const TaskList = ({ planId }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Study chapter 1', completed: false },
    { id: 2, title: 'Practice problems', completed: true },
  ])
  const [newTask, setNewTask] = useState('')

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), title: newTask, completed: false }])
      setNewTask('')
    }
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task))
  }

  return (
    <div>
      <ul>
        {tasks.map(task => (
          <li key={task.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
              className="mr-2"
            />
            <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add new task"
          className="p-2 border rounded mr-2"
        />
        <button onClick={addTask} className="bg-green-500 text-white p-2 rounded">Add</button>
      </div>
    </div>
  )
}

export default TaskList