"use client"

import { useState, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import Swal from 'sweetalert2'

interface Entry {
  id: string
  date: string
  timeIn: string
  timeOut: string
  breakTime: number
  hours: number
}

export default function OJTCounter() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<Entry[]>([])
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeIn: "",
    timeOut: "",
    breakTime: 0,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [targetHours, setTargetHours] = useState(486)

  useEffect(() => {
    const key = session?.user?.email ? `ojtEntries_${session.user.email}` : 'ojtEntries_guest'
    const saved = localStorage.getItem(key)
    if (saved) {
      setEntries(JSON.parse(saved))
    }
  }, [session])

  useEffect(() => {
    const key = session?.user?.email ? `ojtEntries_${session.user.email}` : 'ojtEntries_guest'
    localStorage.setItem(key, JSON.stringify(entries))
  }, [entries, session])

  useEffect(() => {
    if (session?.user?.email) {
      const targetKey = `targetHours_${session.user.email}`
      const savedTarget = localStorage.getItem(targetKey)
      if (savedTarget) {
        setTargetHours(parseFloat(savedTarget))
      } else {
        // First login, prompt for target
        Swal.fire({
          title: 'Set Your Target Hours',
          input: 'number',
          inputLabel: 'Enter your OJT target hours',
          inputValue: 486,
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value || value <= 0) {
              return 'Please enter a valid number greater than 0'
            }
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const target = parseFloat(result.value)
            setTargetHours(target)
            localStorage.setItem(targetKey, target.toString())
          }
        })
      }
    }
  }, [session])

  const calculateHours = (timeIn: string, timeOut: string, breakTime: number) => {
    const inDate = new Date(`1970-01-01T${timeIn}:00`)
    const outDate = new Date(`1970-01-01T${timeOut}:00`)
    const diffMs = outDate.getTime() - inDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours - breakTime)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      signIn("google")
      return
    }
    if (form.timeOut <= form.timeIn) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Time',
        text: 'Time Out must be after Time In'
      })
      return
    }
    if (entries.some(entry => entry.date === form.date && entry.id !== editingId)) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Date',
        text: 'You can only have one entry per day'
      })
      return
    }
    const hours = calculateHours(form.timeIn, form.timeOut, form.breakTime)
    const entry: Entry = {
      id: editingId || Date.now().toString(),
      date: form.date,
      timeIn: form.timeIn,
      timeOut: form.timeOut,
      breakTime: form.breakTime,
      hours,
    }
    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? entry : e))
      setEditingId(null)
      Swal.fire({
        icon: 'success',
        title: 'Entry Updated',
        text: 'Your entry has been updated successfully'
      })
    } else {
      setEntries([...entries, entry])
      Swal.fire({
        icon: 'success',
        title: 'Entry Added',
        text: 'Your entry has been added successfully'
      })
    }
    setForm({ date: new Date().toISOString().split('T')[0], timeIn: "", timeOut: "", breakTime: 0 })
  }

  const editEntry = (entry: Entry) => {
    setForm({
      date: entry.date,
      timeIn: entry.timeIn,
      timeOut: entry.timeOut,
      breakTime: entry.breakTime,
    })
    setEditingId(entry.id)
  }

  const deleteEntry = (id: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        setEntries(entries.filter(e => e.id !== id))
        Swal.fire(
          'Deleted!',
          'Your entry has been deleted.',
          'success'
        )
      }
    })
  }

  const clearAll = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete all entries. You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clear all!'
    }).then((result) => {
      if (result.isConfirmed) {
        setEntries([])
        Swal.fire(
          'Cleared!',
          'All entries have been cleared.',
          'success'
        )
      }
    })
  }

  const exportCSV = () => {
    let csv = "Date,Time In,Time Out,Break (hrs),Hours\n"
    entries.forEach(entry => {
      csv += `${entry.date},${entry.timeIn},${entry.timeOut},${entry.breakTime},${entry.hours.toFixed(2)}\n`
    })
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ojt_hours.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)
  const progress = Math.min((totalHours / targetHours) * 100, 100)

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">OJT Hours Counter</h1>
              <div className="flex items-center space-x-4">
                {session ? (
                  <>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Welcome, {session.user?.name}</span>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
                    >
                      {darkMode ? "☀️" : "🌙"}
                    </button>
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
                    >
                      {darkMode ? "☀️" : "🌙"}
                    </button>
                    <button
                      onClick={() => signIn("google")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Sign In with Google
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Add Entry</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time In</label>
                      <input
                        type="time"
                        value={form.timeIn}
                        onChange={(e) => setForm({ ...form, timeIn: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Out</label>
                      <input
                        type="time"
                        value={form.timeOut}
                        onChange={(e) => setForm({ ...form, timeOut: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Break Time (hours)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={form.breakTime}
                        onChange={(e) => setForm({ ...form, breakTime: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingId ? "Update Entry" : "Add Entry"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setForm({ date: "", timeIn: "", timeOut: "", breakTime: 0 })
                        }}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Total Hours: {totalHours.toFixed(2)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Target: {targetHours} hours ({progress.toFixed(1)}% complete)</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Entries</h3>
                <div className="space-x-2">
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Break (hrs)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.timeIn}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.timeOut}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.breakTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.hours.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => editEntry(entry)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}