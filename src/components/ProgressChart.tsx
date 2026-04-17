const ProgressChart = () => {
  const progress = 75 // Example progress

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-xl mb-2">Overall Progress</h3>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-600 h-4 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2">{progress}% completed</p>
    </div>
  )
}

export default ProgressChart