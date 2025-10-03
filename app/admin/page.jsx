'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, Users, Send, AlertCircle, CheckCircle, Loader2, 
  UserPlus, Activity, TrendingUp, Clock, Filter, Search,
  RefreshCw, LogOut, Shield, Sparkles, Heart, Bell, Home, MessageSquare
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPreference, setFilterPreference] = useState('all')
  const [sendingEmail, setSendingEmail] = useState({ type: '', loading: false })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [emailType, setEmailType] = useState('welcome')
  const [selectAll, setSelectAll] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setStats(data.stats || {})
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load users' })
    }
    setLoading(false)
  }

  useEffect(() => {
    // Check if admin key is stored
    const storedKey = localStorage.getItem('av9assist_admin_key')
    if (storedKey) {
      setAdminKey(storedKey)
      setAuthenticated(true)
      loadUsers()
    }
  }, [])

  const handleAuth = () => {
    if (adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY || adminKey === '10729') {
      localStorage.setItem('av9assist_admin_key', adminKey)
      setAuthenticated(true)
      loadUsers()
    } else {
      setMessage({ type: 'error', text: 'Invalid admin key' })
    }
  }

  const sendWelcomeEmail = async (email) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          email
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Welcome email sent to ${email}` })
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to send email to ${email}` })
    }
  }

  const sendBroadcast = async (type) => {
    const typeNames = {
      welcome: 'Welcome',
      update: 'Update',
      engagement: 'Engagement'
    }
    
    if (!confirm(`Send ${typeNames[type]} emails to all eligible users?\n\nThis will send emails to users who have opted in to receive ${type} emails.`)) {
      return
    }

    setSendingEmail({ type, loading: true })
    setMessage({ type: '', text: '' })
    
    try {
      const response = await fetch(`/api/send-email?type=${type}&adminKey=${adminKey}`)
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${typeNames[type]} emails sent successfully! ${data.sent} sent, ${data.failed} failed` 
        })
        loadUsers() // Refresh user list
      } else {
        throw new Error(data.error || 'Failed to send broadcast')
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Failed to send ${typeNames[type]} emails: ${error.message}` 
      })
    }
    
    setSendingEmail({ type: '', loading: false })
  }

  // Toggle select all users
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.email))
    }
    setSelectAll(!selectAll)
  }

  // Toggle individual user selection
  const toggleUserSelection = (email) => {
    setSelectedUsers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    )
  }

  // Send emails to selected users
  const sendToSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one user' })
      return
    }

    const emailTypeNames = {
      welcome: 'Welcome (Onboarding)',
      update: 'Update',
      engagement: 'Engagement',
      custom: 'Custom'
    }

    if (!confirm(`Send ${emailTypeNames[emailType]} emails to ${selectedUsers.length} selected user(s)?`)) {
      return
    }

    setSendingEmail({ type: 'selected', loading: true })
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          emails: selectedUsers,
          adminKey: adminKey
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ ${emailTypeNames[emailType]} emails sent to ${selectedUsers.length} user(s)!`
        })
        setSelectedUsers([])
        setSelectAll(false)
      } else {
        throw new Error(data.error || 'Failed to send emails')
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Failed to send emails: ${error.message}`
      })
    }

    setSendingEmail({ type: '', loading: false })
  }

  // Filter users based on search and preferences
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterPreference === 'all' || 
      (filterPreference === 'updates' && user.emailPreferences?.updates) ||
      (filterPreference === 'engagement' && user.emailPreferences?.engagement)
    return matchesSearch && matchesFilter
  })

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 hover:scale-110 transition-transform"
          title="Back to Home"
        >
          <Home className="h-5 w-5" />
        </Button>
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>Enter your admin key to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey" className="text-sm font-medium">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Enter your admin key"
                className="h-11"
              />
            </div>
            {message.text && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleAuth} className="w-full h-11 text-base">
              <Shield className="mr-2 h-4 w-4" />
              Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:scale-110 transition-transform mt-1"
              title="Go Back"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Manage users, analytics, and email campaigns</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              size="sm"
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/chat')} 
              size="sm"
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button variant="outline" onClick={loadUsers} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => {
              localStorage.removeItem('av9assist_admin_key')
              setAuthenticated(false)
            }} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <Activity className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.activeToday}</div>
                <p className="text-xs text-muted-foreground mt-1">Users active today</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {users.reduce((sum, u) => sum + (u.visitCount || 1), 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All-time visits</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Visits</CardTitle>
                <Clock className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {users.length > 0 
                    ? (users.reduce((sum, u) => sum + (u.visitCount || 1), 0) / users.length).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per user average</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Email Management Section - NEW */}
        <Card className="shadow-xl border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Send className="h-6 w-6 text-primary" />
                  Email Management
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Select users and send targeted emails
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-3 py-1">
                {selectedUsers.length} Selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Email Type Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Email Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setEmailType('welcome')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'welcome'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <UserPlus className={`h-6 w-6 mx-auto mb-2 ${emailType === 'welcome' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${emailType === 'welcome' ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                    Welcome
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Onboarding</p>
                </button>

                <button
                  onClick={() => setEmailType('update')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'update'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                      : 'border-border hover:border-purple-300'
                  }`}
                >
                  <Bell className={`h-6 w-6 mx-auto mb-2 ${emailType === 'update' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${emailType === 'update' ? 'text-purple-700 dark:text-purple-400' : ''}`}>
                    Updates
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">New features</p>
                </button>

                <button
                  onClick={() => setEmailType('engagement')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'engagement'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30'
                      : 'border-border hover:border-pink-300'
                  }`}
                >
                  <Heart className={`h-6 w-6 mx-auto mb-2 ${emailType === 'engagement' ? 'text-pink-500' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${emailType === 'engagement' ? 'text-pink-700 dark:text-pink-400' : ''}`}>
                    Engagement
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Stay connected</p>
                </button>

                <button
                  onClick={() => setEmailType('missing')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === 'missing'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                      : 'border-border hover:border-orange-300'
                  }`}
                >
                  <Clock className={`h-6 w-6 mx-auto mb-2 ${emailType === 'missing' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${emailType === 'missing' ? 'text-orange-700 dark:text-orange-400' : ''}`}>
                    Missing You
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Re-engage</p>
                </button>
              </div>
            </div>

            {/* User Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Users</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto border-2 rounded-lg p-3 space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.email}
                    onClick={() => toggleUserSelection(user.email)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUsers.includes(user.email)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedUsers.includes(user.email)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedUsers.includes(user.email) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          {user.emailPreferences?.updates && (
                            <Badge variant="secondary" className="text-xs">Updates</Badge>
                          )}
                          {user.emailPreferences?.engagement && (
                            <Badge variant="secondary" className="text-xs">Engagement</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={sendToSelectedUsers}
              disabled={sendingEmail.loading || selectedUsers.length === 0}
              className="w-full h-12 text-base"
              size="lg"
            >
              {sendingEmail.type === 'selected' && sendingEmail.loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Sending to {selectedUsers.length} user(s)...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send to {selectedUsers.length} Selected User(s)
                </>
              )}
            </Button>

            {/* Info Box */}
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-300">
                <strong>Note:</strong> Onboarding (Welcome) emails are automatically sent to new users on their first login. 
                You can manually resend them here if needed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Message Alert */}
        {message.text && (
          <Alert 
            variant={message.type === 'error' ? 'destructive' : 'default'}
            className="border-2 shadow-lg animate-in slide-in-from-top-2"
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <AlertDescription className="text-base font-medium">{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Email Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Welcome Email Card */}
          <Card className="shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  <CardTitle className="text-xl">Welcome</CardTitle>
                </div>
                <Sparkles className="h-5 w-5 opacity-70" />
              </div>
              <CardDescription className="text-blue-100 mt-2">
                Send welcome emails to new users
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  Greet new users with a warm welcome message
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: Users who opted in for tips
                </p>
                <p className="text-sm font-medium">
                  Recipients: {users.filter(u => u.emailPreferences?.tips).length} users
                </p>
              </div>
              <Button 
                onClick={() => sendBroadcast('welcome')}
                disabled={sendingEmail.loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
              >
                {sendingEmail.type === 'welcome' && sendingEmail.loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Welcome Emails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Update Email Card */}
          <Card className="shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2">
            <CardHeader className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  <CardTitle className="text-xl">Updates</CardTitle>
                </div>
                <TrendingUp className="h-5 w-5 opacity-70" />
              </div>
              <CardDescription className="text-purple-100 mt-2">
                Notify users about new features
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  Share latest features and improvements
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: Users who opted in for updates
                </p>
                <p className="text-sm font-medium">
                  Recipients: {users.filter(u => u.emailPreferences?.updates).length} users
                </p>
              </div>
              <Button 
                onClick={() => sendBroadcast('update')}
                disabled={sendingEmail.loading}
                className="w-full h-11 bg-purple-600 hover:bg-purple-700"
              >
                {sendingEmail.type === 'update' && sendingEmail.loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Update Emails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Engagement Email Card */}
          <Card className="shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2">
            <CardHeader className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-6 w-6" />
                  <CardTitle className="text-xl">Engagement</CardTitle>
                </div>
                <Activity className="h-5 w-5 opacity-70" />
              </div>
              <CardDescription className="text-pink-100 mt-2">
                Re-engage inactive users
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  Bring back users who haven't visited recently
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: Users who opted in for engagement
                </p>
                <p className="text-sm font-medium">
                  Recipients: {users.filter(u => u.emailPreferences?.engagement).length} users
                </p>
              </div>
              <Button 
                onClick={() => sendBroadcast('engagement')}
                disabled={sendingEmail.loading}
                className="w-full h-11 bg-pink-600 hover:bg-pink-700"
              >
                {sendingEmail.type === 'engagement' && sendingEmail.loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Send Engagement Emails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Registered Users</CardTitle>
                <CardDescription className="text-base mt-1">
                  {filteredUsers.length} {filteredUsers.length === users.length ? 'total' : `of ${users.length}`} users
                </CardDescription>
              </div>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filterPreference}
                  onChange={(e) => setFilterPreference(e.target.value)}
                  className="h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="updates">Updates Only</option>
                  <option value="engagement">Engagement Only</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <div 
                  key={user.email || index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/50 hover:border-primary/50 transition-all gap-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-base">{user.email}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Joined: {new Date(user.joinedAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {user.visitCount || 1} visits
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {user.emailPreferences?.updates && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30">
                          Updates
                        </Badge>
                      )}
                      {user.emailPreferences?.engagement && (
                        <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30">
                          Engagement
                        </Badge>
                      )}
                      {user.emailPreferences?.tips && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                          Tips
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => sendWelcomeEmail(user.email)}
                    className="h-9 px-4"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              ))}
              
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {searchQuery || filterPreference !== 'all' 
                      ? 'No users match your filters' 
                      : 'No users registered yet'}
                  </p>
                </div>
              )}
              
              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-3" />
                  <p className="text-muted-foreground font-medium">Loading users...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
