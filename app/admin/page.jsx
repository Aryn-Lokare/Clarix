'use client'

import { useState, useEffect } from 'react'
import { supabase, USER_ROLES } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    role: USER_ROLES.USER,
    first_name: '',
    last_name: '',
    username: ''
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    setUser(user)

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== USER_ROLES.SUPER_ADMIN) {
      router.push('/dashboard')
      return
    }

    setProfile(profile)
    fetchUsers()
    setLoading(false)
  }

  const fetchUsers = async () => {
    try {
      // Prefer backend list endpoint (uses service role and bypasses RLS)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const resp = await fetch('http://localhost:8000/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!resp.ok) {
        // Fallback to direct query if backend not available
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setUsers(data || [])
        return
      }

      const data = await resp.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      // Get current user's session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Create user via backend API
      const formData = new FormData()
      formData.append('email', newUserData.email)
      formData.append('password', newUserData.password)
      formData.append('role', newUserData.role)
      formData.append('first_name', newUserData.first_name)
      formData.append('last_name', newUserData.last_name)
      if (newUserData.username) formData.append('username', newUserData.username)

      const response = await fetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create user')
      }

      const result = await response.json()
      console.log('User created successfully:', result)

      setShowModal(false)
      setNewUserData({
        email: '',
        password: '',
        role: USER_ROLES.USER,
        first_name: '',
        last_name: '',
        username: ''
      })
      fetchUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error adding user: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    setActionLoading(true)

    try {
      // Get current user's session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Update user role via backend API
      const formData = new FormData()
      formData.append('role', newRole)

      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update user role')
      }

      const result = await response.json()
      console.log('User role updated successfully:', result)

      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error updating user role: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setActionLoading(true)

    try {
      // Get current user's session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Delete user via backend API
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete user')
      }

      const result = await response.json()
      console.log('User deleted successfully:', result)

      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getRoleBadge = (role) => {
    const badges = {
      [USER_ROLES.USER]: 'bg-gray-100 text-gray-800',
      [USER_ROLES.DOCTOR]: 'bg-blue-100 text-blue-800',
      [USER_ROLES.SUPER_ADMIN]: 'bg-red-100 text-red-800'
    }
    return badges[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleIcon = (role) => {
    const icons = {
      [USER_ROLES.USER]: '👤',
      [USER_ROLES.DOCTOR]: '👨‍⚕️',
      [USER_ROLES.SUPER_ADMIN]: '👑'
    }
    return icons[role] || '👤'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {profile?.email} (Super Admin)
              </span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👤</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👨‍⚕️</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Doctors</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === USER_ROLES.DOCTOR).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👑</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Super Admins</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === USER_ROLES.SUPER_ADMIN).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📊</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Regular Users</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.filter(u => u.role === USER_ROLES.USER).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Messages</h3>
                <p className="text-gray-600">View & respond to messages</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin/messages')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              View Messages
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">System Analytics</h3>
                <p className="text-gray-600">View system performance</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin/analytics')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              View Analytics
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
                <p className="text-gray-600">Configure system parameters</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/admin/settings')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              Open Settings
            </button>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              User Management
            </h3>
            <button
              onClick={() => {
                setModalType('add')
                setShowModal(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Add User
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-lg mr-3">{getRoleIcon(user.role)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username || (user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.email)}
                          </div>
                          <div className="text-sm text-gray-500">{user.username ? user.email : user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === USER_ROLES.DOCTOR ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {user.approved ? 'Approved' : 'Pending'}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {(() => { /* derive disabling rules */ })()}
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                          disabled={(() => {
                            const superAdminCount = users.filter(u => u.role === USER_ROLES.SUPER_ADMIN).length;
                            const isTargetSuperAdmin = user.role === USER_ROLES.SUPER_ADMIN;
                            const isSelf = user.id === profile?.id;
                            // Disable if currently loading, or
                            //  - the target is a super admin and either
                            //    a) there is only one super admin (protect last admin), or
                            //    b) the target is the currently logged-in super admin (no self-downgrade)
                            return (
                              actionLoading ||
                              (isTargetSuperAdmin && (superAdminCount === 1 || isSelf))
                            );
                          })()}
                          className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
                        >
                          <option value={USER_ROLES.USER}>User</option>
                          <option value={USER_ROLES.DOCTOR}>Doctor</option>
                          <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={(() => {
                            const superAdminCount = users.filter(u => u.role === USER_ROLES.SUPER_ADMIN).length;
                            const isTargetSuperAdmin = user.role === USER_ROLES.SUPER_ADMIN;
                            const isSelf = user.id === profile?.id;
                            // Disable delete if loading, or deleting self, or deleting the only super admin
                            return actionLoading || isSelf || (isTargetSuperAdmin && superAdminCount === 1);
                          })()}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                        {user.role === USER_ROLES.DOCTOR && (
                          <button
                            onClick={async () => {
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session) throw new Error('No active session');
                                const fd = new FormData();
                                fd.append('approved', String(!user.approved));
                                const resp = await fetch(`http://localhost:8000/api/admin/users/${user.id}/approve`, {
                                  method: 'PUT',
                                  headers: { Authorization: `Bearer ${session.access_token}` },
                                  body: fd,
                                });
                                if (!resp.ok) {
                                  const er = await resp.json();
                                  throw new Error(er.detail || 'Failed to update approval');
                                }
                                fetchUsers();
                              } catch (err) {
                                alert(err.message);
                              }
                            }}
                            className={`px-2 py-1 rounded ${user.approved ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                          >
                            {user.approved ? 'Revoke' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New User
              </h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={newUserData.first_name}
                    onChange={(e) => setNewUserData({...newUserData, first_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={newUserData.last_name}
                    onChange={(e) => setNewUserData({...newUserData, last_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  >
                    <option value={USER_ROLES.USER}>User</option>
                    <option value={USER_ROLES.DOCTOR}>Doctor</option>
                    <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

