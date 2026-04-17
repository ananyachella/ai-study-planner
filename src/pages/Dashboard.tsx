import { useState } from 'react'
import TaskList from '../components/TaskList'
import ProgressChart from '../components/ProgressChart'
import { StudyPlan } from '../types'

const Dashboard = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([
    { id: 1, name: 'Math Study Plan', tasks: [] },
    { id: 2, name: 'Science Study Plan', tasks: [] },
  ])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AI Study Planner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-2xl mb-2">Study Plans</h2>
          {studyPlans.map(plan => (
            <div key={plan.id} className="bg-white p-4 rounded shadow mb-2">
              <h3 className="text-xl">{plan.name}</h3>
              <TaskList planId={plan.id} />
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-2xl mb-2">Progress Tracking</h2>
          <ProgressChart />
        </div>
      </div>
    </div>
  )
}

export default Dashboard