"use client"

import { useState, useEffect, Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { api } from "@/lib/api"
import { UserRole, type User } from "@/types"
import useSWR from "swr"
import { Search, MoreHorizontal, UserPlus, Shield, ShieldAlert, Users, Edit, Trash2, Ban, CheckCircle } from "lucide-react"
import { useAuthContext } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

function AdminUsersContent() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext()

  const [searchQuery, setSearchQuery]       = useState("")
  const [roleFilter, setRoleFilter]         = useState<string>("all")
  const [editingUser, setEditingUser]       = useState<User | null>(null)
  const [editName, setEditName]             = useState("")
  const [editRole, setEditRole]             = useState<UserRole>(UserRole.CITIZEN)
  const [isCreateOpen, setIsCreateOpen]     = useState(false)
  const [isSaving, setIsSaving]             = useState(false)

  // Create form state
  const [newEmail, setNewEmail]       = useState("")
  const [newName, setNewName]         = useState("")
  const [newRole, setNewRole]         = useState<UserRole>(UserRole.CITIZEN)
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login")
      else if (user?.role !== UserRole.ADMIN) router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, user, router])

  const { data: users, isLoading, mutate } = useSWR(
    isAuthenticated && user?.role === UserRole.ADMIN ? "admin-users" : null,
    () => api.admin.getUsers()
  )

  const filteredUsers = users?.filter((u) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = u.email.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q)
    const matchesRole   = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:   return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />Admin</Badge>
      case UserRole.OFFICER: return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Officer</Badge>
      default:               return <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />Citizen</Badge>
    }
  }

  const handleUpdateRole = async (u: User, newRole: UserRole) => {
    try {
      await api.admin.updateUserRole(u.id, newRole)
      toast.success(`${u.full_name || u.email} is now ${newRole}`)
      mutate()
    } catch { toast.error("Failed to update role") }
  }

  const handleToggleActive = async (u: User) => {
    try {
      await api.admin.toggleUserActive(u.id, !u.is_active)
      toast.success(`User ${u.is_active ? "deactivated" : "activated"}`)
      mutate()
    } catch { toast.error("Failed to update user") }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.full_name || u.email}? This cannot be undone.`)) return
    try {
      await api.admin.deleteUser(u.id)
      toast.success("User deleted")
      mutate()
    } catch { toast.error("Failed to delete user") }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setIsSaving(true)
    try {
      await api.admin.updateUser(editingUser.id, { full_name: editName, role: editRole })
      toast.success("User updated")
      mutate()
      setEditingUser(null)
    } catch { toast.error("Failed to update user") }
    finally { setIsSaving(false) }
  }

  const handleCreate = async () => {
    if (!newEmail || !newPassword) { toast.error("Email and password are required"); return }
    setIsSaving(true)
    try {
      await api.admin.createUser({ email: newEmail, full_name: newName, role: newRole, password: newPassword })
      toast.success("User created")
      mutate()
      setIsCreateOpen(false)
      setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole(UserRole.CITIZEN)
    } catch (e: any) { toast.error(e.message || "Failed to create user") }
    finally { setIsSaving(false) }
  }

  if (authLoading || user?.role !== UserRole.ADMIN) return null

  const stats = {
    total:    users?.length || 0,
    admins:   users?.filter(u => u.role === UserRole.ADMIN).length || 0,
    officers: users?.filter(u => u.role === UserRole.OFFICER).length || 0,
    citizens: users?.filter(u => u.role === UserRole.CITIZEN).length || 0,
  }

  return (
    <AppLayout showSidebar>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />Add User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Users",  value: stats.total,    icon: Users,       color: "bg-primary/10 text-primary" },
            { label: "Admins",       value: stats.admins,   icon: ShieldAlert, color: "bg-destructive/10 text-destructive" },
            { label: "Officers",     value: stats.officers, icon: Shield,      color: "bg-blue-500/10 text-blue-500" },
            { label: "Citizens",     value: stats.citizens, icon: Users,       color: "bg-muted text-muted-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admins</SelectItem>
                  <SelectItem value={UserRole.OFFICER}>Officers</SelectItem>
                  <SelectItem value={UserRole.CITIZEN}>Citizens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>{filteredUsers?.length || 0} users found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner text="Loading users..." /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                            {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.full_name || "No name"}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "secondary"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setEditingUser(u); setEditName(u.full_name || ""); setEditRole(u.role)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateRole(u, u.role === UserRole.CITIZEN ? UserRole.OFFICER : UserRole.CITIZEN)}>
                              <Shield className="mr-2 h-4 w-4" />
                              {u.role === UserRole.CITIZEN ? "Promote to Officer" : "Demote to Citizen"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(u)} disabled={u.id === user?.id}>
                              {u.is_active
                                ? <><Ban className="mr-2 h-4 w-4" />Deactivate</>
                                : <><CheckCircle className="mr-2 h-4 w-4" />Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"
                              onClick={() => handleDelete(u)}
                              disabled={u.id === user?.id}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div><Label>Email</Label><Input value={editingUser.email} disabled /></div>
              <div>
                <Label>Full Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.CITIZEN}>Citizen</SelectItem>
                    <SelectItem value={UserRole.OFFICER}>Officer</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Email *</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" /></div>
            <div><Label>Full Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" /></div>
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.CITIZEN}>Citizen</SelectItem>
                  <SelectItem value={UserRole.OFFICER}>Officer</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Password *</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

export default function AdminUsersPage() {
  return <Suspense fallback={null}><AdminUsersContent /></Suspense>
}
